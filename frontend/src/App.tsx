import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
import { FrappeProvider } from 'frappe-react-sdk'
import POS from './POS'
function App() {
  const [count, setCount] = useState(0)

  return (
	<div className="App">
	  <FrappeProvider>
		<POS/>
	  </FrappeProvider>
	</div>
  )
}

export default App
