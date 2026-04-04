import db from '../lib/db.ts';

export async function closeCardBill(cardId: number, monthYear: string) {
  return await db.transaction(async (trx) => {
    const card = await trx('cards').where('id', cardId).first();
    if (!card) throw new Error('Cartão não encontrado');

    // Check if the bill for this month already exists
    const existingBill = await trx('card_bills')
      .where({ card_id: cardId, month_year: monthYear })
      .first();

    if (existingBill) {
      throw new Error(`Fatura de ${monthYear} já está fechada.`);
    }

    // Check if previous bill exists and has remaining balance
    const previousBill = await trx('card_bills')
      .where('card_id', cardId)
      .where('month_year', '<', monthYear)
      .orderBy('month_year', 'desc')
      .first();

    let interestAccrued = 0;
    let previousRemaining = 0;

    if (previousBill && Number(previousBill.remaining_balance) > 0) {
      previousRemaining = Number(previousBill.remaining_balance);
      // Juros compostos: remaining_balance * interest_rate
      interestAccrued = previousRemaining * Number(card.interest_rate);
    }

    // Current bill amount is the sum of new transactions (current_bill) + previous remaining + interest
    const closingAmount = Number(card.current_bill) + previousRemaining + interestAccrued;

    const [billId] = await trx('card_bills').insert({
      card_id: cardId,
      month_year: monthYear,
      closing_amount: closingAmount,
      paid_amount: 0,
      remaining_balance: closingAmount,
      interest_rate: card.interest_rate,
      interest_accrued: interestAccrued,
      status: 'closed'
    });

    // Reset the card's current_bill for the new cycle
    await trx('cards').where('id', cardId).update({ current_bill: 0 });

    return { billId, closingAmount, interestAccrued };
  });
}

export async function payCardBill(billId: number, amount: number) {
  return await db.transaction(async (trx) => {
    const bill = await trx('card_bills').where('id', billId).first();
    if (!bill) throw new Error('Fatura não encontrada');

    const newPaidAmount = Number(bill.paid_amount) + amount;
    const newRemaining = Number(bill.closing_amount) - newPaidAmount;

    await trx('card_bills').where('id', billId).update({
      paid_amount: newPaidAmount,
      remaining_balance: newRemaining > 0 ? newRemaining : 0,
      status: newRemaining <= 0 ? 'paid' : 'partial'
    });

    return { newRemaining };
  });
}

export function calculateProjectedInterest(currentBalance: number, interestRate: number) {
  let balance = currentBalance;
  let totalInterest = 0;
  let months = 0;
  const projection = [];
  
  // Loop até zerar ou limite de 60 meses para evitar loop infinito
  while (balance > 0 && months < 60) {
    months++;
    const minPayment = Math.max(balance * 0.15, 50); // Pagamento mínimo de 15% ou R$ 50
    const payment = Math.min(minPayment, balance);
    
    balance -= payment;
    
    if (balance > 0) {
      const interest = balance * interestRate;
      totalInterest += interest;
      balance += interest;
      projection.push({ month: months, balance, interest, payment });
    } else {
      projection.push({ month: months, balance: 0, interest: 0, payment });
    }
  }
  
  return {
    monthsToPayoff: months,
    totalInterestPaid: totalInterest,
    projection
  };
}
