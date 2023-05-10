import React from 'react';
import Head from './Head-Xero';
import Header from './Header-Xero';

const HomeComponent = ({ authenticated }) => {
  const decodedIdToken = authenticated?.decodedIdToken || '';
  const decodedAccessToken = authenticated?.decodedAccessToken || '';
  const activeTenant = authenticated?.activeTenant || null;
  const accessTokenExpires = authenticated?.accessTokenExpires || '';

  return (
    <>
      <Head />

      {/* Replace with your shared/nav component */}
      <div className="core-content">
        {/* Replace with your shared/header component */}

        <Header />

        <div className="body-wrapper">
          <div className="body-content">
            {decodedIdToken && decodedAccessToken && activeTenant ? (
              <>
                <h4 id="authenticated">
                  You are authenticated with: <span>{activeTenant.tenantName}</span>
                </h4>
                <hr />
                <h5>Token Expires: <span style={{ fontWeight: 'normal' }}>{accessTokenExpires}</span></h5>
                <h4>Active Tenant:</h4>
                <pre>
                  <code className="language-javascript">
                    {activeTenant.orgData
                      ? JSON.stringify(activeTenant.orgData, null, 2).replace(/[{}]/g, '').substring(0, 300) + ' ...'
                      : JSON.stringify(activeTenant, null, 2).replace(/[{}]/g, '').substring(0, 300) + ' ...'}
                  </code>
                </pre>
                <hr />
                <h4>Access Token Data:</h4>
                <pre>
                  <code className="language-javascript">
                    {JSON.stringify(decodedAccessToken, null, 2).replace(/[{}]/g, '')}
                  </code>
                </pre>
                <hr />
                <h4>Id Token Data:</h4>
                <pre>
                  <code className="language-javascript">
                    {JSON.stringify(decodedIdToken, null, 2).replace(/[{}]/g, '')}
                  </code>
                </pre>
              </>
            ) : (
              <>
                <h2>Please authenticate to explore the tutorial</h2>
                <p>
                  This tutorial will show developers how to utilise our API endpoints with the "xero-node" SDK version in package.json
                </p>
                <h3 style={{ color: 'red' }}>WARNING!</h3>
                <p>
                  This tutorial will Create, Read, Update & Delete REAL objects in the authenticated Xero organisation.
                </p>
                <p>
                  Please only authenticate with a{' '}
                  <a href="https://developer.xero.com/documentation/getting-started/development-accounts" target="_blank" rel="noreferrer">
                    Demo Company
                  </a>{' '}
                  or a non-production organisation.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default HomeComponent;