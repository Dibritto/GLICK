import db from '../lib/db.ts';

export async function createDebtInstallments(debtId: number, userId: number) {
  return await db.transaction(async (trx) => {
    const debt = await trx('debts').where({ id: debtId, user_id: userId }).first();
    if (!debt) throw new Error('Dívida não encontrada');

    const principal = Number(debt.principal);
    const rate = Number(debt.monthly_rate);
    const months = Number(debt.total_months);
    const startDate = new Date(debt.start_date);

    const installments = [];
    let balance = principal;

    if (debt.payment_method === 'Price') {
      // Tabela Price: Parcela fixa
      const pmt = (principal * rate) / (1 - Math.pow(1 + rate, -months));
      
      for (let i = 1; i <= months; i++) {
        const interest = balance * rate;
        const amortization = pmt - interest;
        balance -= amortization;

        const date = new Date(startDate);
        date.setMonth(date.getMonth() + i);

        installments.push({
          user_id: userId,
          account_id: 1, // Placeholder, idealmente o usuário escolhe a conta
          type: 'expense',
          category: 'Dívidas/Empréstimos',
          amount: pmt,
          date: date.toISOString().split('T')[0],
          description: `${debt.name} - Parcela ${i}/${months}`,
          status: 'pending',
          installments: months,
          installment_id: `debt_${debtId}`
        });
      }
    } else if (debt.payment_method === 'SAC') {
      // Tabela SAC: Amortização constante
      const amortization = principal / months;

      for (let i = 1; i <= months; i++) {
        const interest = balance * rate;
        const pmt = amortization + interest;
        balance -= amortization;

        const date = new Date(startDate);
        date.setMonth(date.getMonth() + i);

        installments.push({
          user_id: userId,
          account_id: 1, // Placeholder
          type: 'expense',
          category: 'Dívidas/Empréstimos',
          amount: pmt,
          date: date.toISOString().split('T')[0],
          description: `${debt.name} - Parcela ${i}/${months}`,
          status: 'pending',
          installments: months,
          installment_id: `debt_${debtId}`
        });
      }
    }

    if (installments.length > 0) {
      await trx('transactions').insert(installments);
    }

    return installments;
  });
}

export async function simulatePayoff(userId: number, extraMonthly: number, strategy: 'snowball' | 'avalanche') {
  const debts = await db('debts').where({ user_id: userId, status: 'active' });
  
  // Clone debts for simulation
  let simDebts = debts.map(d => ({
    id: d.id,
    name: d.name,
    balance: Number(d.principal), // Simplificação: assume que o principal é o saldo atual para a simulação
    rate: Number(d.monthly_rate),
    payment_method: d.payment_method,
    months_left: Number(d.total_months),
    minimum_payment: d.payment_method === 'Price' 
      ? (Number(d.principal) * Number(d.monthly_rate)) / (1 - Math.pow(1 + Number(d.monthly_rate), -Number(d.total_months)))
      : (Number(d.principal) / Number(d.total_months)) + (Number(d.principal) * Number(d.monthly_rate)) // Aproximação SAC 1ª parcela
  }));

  const timeline = [];
  let month = 0;

  let totalInterestPaid = 0;

  while (simDebts.length > 0 && month < 360) { // Max 30 years
    month++;
    
    // Sort debts based on strategy
    if (strategy === 'avalanche') {
      simDebts.sort((a, b) => b.rate - a.rate); // Highest rate first
    } else {
      simDebts.sort((a, b) => a.balance - b.balance); // Lowest balance first
    }

    let extraAvailable = extraMonthly;

    // Pay minimums first
    for (let i = 0; i < simDebts.length; i++) {
      const d = simDebts[i];
      const interest = d.balance * d.rate;
      totalInterestPaid += interest;
      d.balance += interest; // Apply interest

      let payment = Math.min(d.minimum_payment, d.balance);
      d.balance -= payment;
    }

    // Apply extra to the target debt
    if (simDebts.length > 0) {
      const target = simDebts[0];
      let extraPayment = Math.min(extraAvailable, target.balance);
      target.balance -= extraPayment;
      
      if (target.balance <= 0.01) {
        timeline.push({
          id: target.id,
          name: target.name,
          monthsToPayoff: month
        });
        simDebts.shift(); // Remove paid debt
      }
    }
  }

  return {
    strategy,
    totalMonthsToPayoff: month,
    totalInterestPaid,
    payoffOrder: timeline
  };
}
