import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverTsPath = path.join(__dirname, 'server.ts');
let serverCode = fs.readFileSync(serverTsPath, 'utf-8');

// We will manually remove the blocks from server.ts and replace them with router imports.
// To do this safely, we will replace the whole block of routes with the new imports and app.use statements.

const startMarker = "app.get('/api/auth/me'";
const endMarker = "app.get('/api/market/price/:symbol'";

const startIndex = serverCode.indexOf(startMarker);
const endIndex = serverCode.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const endOfBlock = serverCode.indexOf("});", endIndex) + 3;
  
  const codeToRemove = serverCode.substring(startIndex, endOfBlock);
  
  const newCode = `
  // --- API ROUTES DELEGATION ---
  app.use('/api/user', authenticateToken, userRoutes);
  app.use('/api/transactions', transactionRoutes); // Auth is inside
  app.use('/api/accounts', accountRoutes); // Auth is inside
  app.use('/api/crypto', authenticateToken, cryptoRoutes);
  app.use('/api/investments', authenticateToken, investmentRoutes);
  app.use('/api/modules', authenticateToken, moduleRoutes);
  app.use('/api/cards', authenticateToken, cardRoutes);
  app.use('/api/goals', authenticateToken, goalRoutes);
  app.use('/api/categories', authenticateToken, categoryRoutes);
  app.use('/api/finance', authenticateToken, financeRoutes);
  app.use('/api/recurring-transactions', authenticateToken, recurringTransactionRoutes);
  app.use('/api/forecasts', authenticateToken, forecastRoutes);
  app.use('/api/market', authenticateToken, marketRoutes);
  `;
  
  serverCode = serverCode.replace(codeToRemove, newCode);
  
  // Add imports at the top
  const importsToAdd = `
import userRoutes from './src/routes/userRoutes.ts';
import moduleRoutes from './src/routes/moduleRoutes.ts';
import cardRoutes from './src/routes/cardRoutes.ts';
import goalRoutes from './src/routes/goalRoutes.ts';
import categoryRoutes from './src/routes/categoryRoutes.ts';
import financeRoutes from './src/routes/financeRoutes.ts';
import recurringTransactionRoutes from './src/routes/recurringTransactionRoutes.ts';
import forecastRoutes from './src/routes/forecastRoutes.ts';
import marketRoutes from './src/routes/marketRoutes.ts';
`;

  serverCode = serverCode.replace(
    "import investmentRoutes from './src/routes/investmentRoutes.ts';",
    "import investmentRoutes from './src/routes/investmentRoutes.ts';" + importsToAdd
  );
  
  // Remove duplicate app.use('/api/transactions', transactionRoutes); and app.use('/api/accounts', accountRoutes);
  // that might be outside the block
  serverCode = serverCode.replace("app.use('/api/transactions', transactionRoutes);", "");
  serverCode = serverCode.replace("app.use('/api/accounts', accountRoutes);", "");
  serverCode = serverCode.replace("app.use('/api/crypto', authenticateToken, cryptoRoutes);", "");
  serverCode = serverCode.replace("app.use('/api/investments', authenticateToken, investmentRoutes);", "");
  
  fs.writeFileSync(serverTsPath, serverCode);
  console.log("server.ts refactored successfully.");
} else {
  console.log("Could not find markers in server.ts");
}
