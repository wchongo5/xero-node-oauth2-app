import {Link} from 'react-router-dom'
import './Header.css';

function Header() {
  return (
    <header className= 'header'>

      <div className="logo">
         <Link to='/'>XeroXD5</Link>
      </div>
      <ul>
         <li>
            <Link to='/invoices'>Facturas</Link>
         </li>
         <li>
            <Link to='/transactions'>Transacções</Link>
         </li>
         <li>
            <Link to='/transfers'>Transferências</Link>
         </li>
      </ul>
    </header>
  )
}

export default Header