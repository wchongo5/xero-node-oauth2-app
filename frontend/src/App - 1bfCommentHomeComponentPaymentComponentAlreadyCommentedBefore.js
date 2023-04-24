import './App.css';
import axios from "axios";

import React, { useState, useEffect } from 'react';

import Payments from './components/Payments';
import HomeComponent from './components/HomeComponent';
import Header from './components/Header';

function App() {

  const [authenticatedData, setAuthenticatedData] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get("http://localhost:3000/authenticated-data");
        const data = await response.json();
        setAuthenticatedData(data);
      } catch (error) {
        console.error("Error fetching authenticated data:", error);
      }
    }

    fetchData();
  }, []);

  return (
    <div>
      <h1>Thanks God</h1>
      <br />

      

      {/* {authenticatedData && (  
      )} */}

      <Header authenticated={authenticatedData.authenticated} consentUrl={authenticatedData.consentUrl} />

      {/* {authenticatedData && (
        <HomeComponent authenticated={authenticatedData.authenticated} />
      )} */}


      {/* <Payments /> */}
    </div>
  );
}

export default App;