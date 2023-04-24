import React from 'react';

const HomeComponent = ({ authenticated }) => {
  return (
    <html>
      {/* Replace with your shared/head component */}
      <body>
        {/* Replace with your shared/nav component */}
        <div className="core-content">
          {/* Replace with your shared/header component */}
          <div className="body-wrapper">
            <div className="body-content">
              {authenticated.decodedIdToken && authenticated.decodedAccessToken && authenticated.activeTenant ? (
                <>
                  <h4 id="authenticated">
                    You are authenticated with: <span>{authenticated.activeTenant.tenantName}</span>
                  </h4>
                  <hr />
                  <h5>Token Expires: <span style={{ fontWeight: 'normal' }}>{authenticated.accessTokenExpires}</span></h5>
                  <h4>Active Tenant:</h4>
                  <pre>
                    <code className="language-javascript">
                      {authenticated.activeTenant.orgData
                        ? JSON.stringify(authenticated.activeTenant.orgData, null, 2).replace(/[{}]/g, '').substring(0, 300) + ' ...'
                        : JSON.stringify(authenticated.activeTenant, null, 2).replace(/[{}]/g, '').substring(0, 300) + ' ...'}
                    </code>
                  </pre>
                  <hr />
                  <h4>Access Token Data:</h4>
                  <pre>
                    <code className="language-javascript">
                      {JSON.stringify(authenticated.decodedAccessToken, null, 2).replace(/[{}]/g, '')}
                    </code>
                  </pre>
                  <hr />
                  <h4>Id Token Data:</h4>
                  <pre>
                    <code className="language-javascript">
                      {JSON.stringify(authenticated.decodedIdToken, null, 2).replace(/[{}]/g, '')}
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
      </body>
    </html>
  );
};

export default HomeComponent;