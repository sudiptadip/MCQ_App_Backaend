import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { ToastContainer } from 'react-toastify'
import { ThemeProvider } from './components/common/ThemeProvider'
import 'react-toastify/dist/ReactToastify.css'

const App = () => {
  return (
    <ThemeProvider defaultTheme="system" storageKey="mcq-app-theme">
      <RouterProvider router={router} />
      <ToastContainer />
    </ThemeProvider>
  )
}

export default App