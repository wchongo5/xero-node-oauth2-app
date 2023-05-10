import './App.css';
import axios from "axios";

import React, { useState, useEffect } from 'react';

import Payments from './pages/Invoices';
import HomeComponent from './components/HomeComponent';
import {BrowserRouter as Router, Routes, Route} from
'react-router-dom'
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import Transactions from './pages/Transactions';
import Transfers from './pages/Transfers';
import Header from './components/Header';


function App() {


  return (
    <>
    <Router>
      <div className='container'>
        <Header />
        <Routes>
          <Route path='/' element={<Dashboard />} />
          <Route path='/invoices' element={<Invoices />} />
          <Route path='/transactions' element={<Transactions />} />
          <Route path='/transfers' element={<Transfers />} />
        </Routes>
        {/* <Payments /> */}
      </div>
    </Router>
    </>
  );
}

export default App;