import './App.css';
import axios from "axios";

import React, { useState, useEffect } from 'react';

import Payments from './components/Payments';
import HomeComponent from './components/HomeComponent';
import Header from './components/Header';

function App() {

  const sessionData = JSON.parse(localStorage.getItem('sessionData'));

  // const [authenticatedData, setAuthenticatedData] = useState(null);
  const [authenticatedData, setAuthenticatedData] = useState({
    authenticated: null,
    consentUrl: null,
  });

  // useEffect(() => {
  //   async function fetchData() {
  //     try {
  //       console.log("Access Token - BeforeGet0")

  //       const accessTokenResponse = await axios.get('http://localhost:3000/access-token');
  //       console.log("Access Token - BeforeGet1")

  //       const accessToken = accessTokenResponse.data.access_token;
      
  //       const response = await axios.get(`http://localhost:3000/proxy?url=${encodeURIComponent("http://localhost:3000/authenticated-data")}`, {
  //         headers: {
  //           'Authorization': `Bearer ${accessToken}` // Use the access token received from the server
  //         }
  //       });


  //       const data = await response.data;
  //       console.log("authData from App.js: " + data)

  //       setAuthenticatedData(data);
  //     } catch (error) {
  //       console.error("Error fetching authenticated data:", error);
  //     }
  //   }

  //   fetchData();
  // }, []);

  return (
    <div>
      <h1>Thanks God</h1>
      <br />



      {/* {authenticatedData && (
        <Header authenticated={authenticatedData.authenticated} consentUrl={authenticatedData.consentUrl} />
      )} */}



      {/* {authenticatedData && (
        <HomeComponent authenticated={authenticatedData.authenticated} />
      )} */}

      <Payments />
    </div>
  );
}

export default App;