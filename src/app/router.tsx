import { createBrowserRouter, Outlet } from 'react-router'
import { HouseholdLayout, NotFound, ReportsRoute, RouteError } from './RouteScreens'
import { PublicOnly, RequireAuth } from './guards'
import { LoginPage } from '../pages/Login/LoginPage'
import { WelcomePage } from '../pages/Welcome/WelcomePage'
import { DashboardPage } from '../pages/Dashboard/DashboardPage'
import { HistoryPage } from '../pages/History/HistoryPage'
import { ExpenseFormPage } from '../pages/Expenses/ExpenseFormPage'
import { IncomeFormPage } from '../pages/Incomes/IncomeFormPage'
import { TransferFormPage } from '../pages/Transfers/TransferFormPage'
import { RecurringPage } from '../pages/Recurring/RecurringPage'
import { RecurringFormPage } from '../pages/Recurring/RecurringFormPage'
import { ConfirmRecurringPage } from '../pages/Recurring/ConfirmRecurringPage'
import { SettingsPage } from '../pages/Settings/SettingsPage'
import { CategoriesPage } from '../pages/Settings/CategoriesPage'
import { AppearancePage } from '../pages/Settings/AppearancePage'

export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    element: <Outlet />,
    children: [
      {
        path: '/entrar',
        element: (
          <PublicOnly>
            <LoginPage />
          </PublicOnly>
        ),
      },
      {
        element: <RequireAuth />,
        children: [
          { path: '/bienvenida', element: <WelcomePage /> },
          {
            element: <HouseholdLayout />,
            children: [
              { index: true, element: <DashboardPage /> },
              { path: 'movimientos', element: <HistoryPage /> },
              { path: 'gastos/nuevo', element: <ExpenseFormPage /> },
              { path: 'gastos/:id', element: <ExpenseFormPage /> },
              { path: 'ingresos/nuevo', element: <IncomeFormPage /> },
              { path: 'ingresos/:id', element: <IncomeFormPage /> },
              { path: 'transferencias/nueva', element: <TransferFormPage /> },
              { path: 'transferencias/:id', element: <TransferFormPage /> },
              { path: 'recurrentes', element: <RecurringPage /> },
              { path: 'recurrentes/nuevo', element: <RecurringFormPage /> },
              { path: 'recurrentes/:id', element: <RecurringFormPage /> },
              { path: 'recurrentes/:id/confirmar', element: <ConfirmRecurringPage /> },
              { path: 'reportes', element: <ReportsRoute /> },
              { path: 'ajustes', element: <SettingsPage /> },
              { path: 'ajustes/categorias', element: <CategoriesPage /> },
              { path: 'ajustes/apariencia', element: <AppearancePage /> },
            ],
          },
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
])
