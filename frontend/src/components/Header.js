import React from 'react';

const Header = ({ authenticated, consentUrl }) => {
//   const loggedIn =
//     typeof authenticated !== 'undefined' &&
//     typeof authenticated.allTenants !== 'undefined' &&
//     authenticated.allTenants &&
//     authenticated.allTenants.length;

   const loggedIn = authenticated && authenticated.allTenants && authenticated.allTenants.length;

  const connectImage = loggedIn
    ? 'https://developer.xero.com/static/images/documentation/ConnectToXero2019/disconnect-white.svg'
    : 'https://developer.xero.com/static/images/documentation/ConnectToXero2019/connect-blue.svg';

  const handleOrgChange = (e, activeTenant) => {
    e.preventDefault();
    const activeOrgId = e.target.active_org_id.value;
    // Call the function to change the organization with activeOrgId and activeTenant
  };

  return (
    <header>
      {typeof consentUrl !== 'undefined' && consentUrl && typeof authenticated !== 'undefined' && (
        <a href={consentUrl}>
          <img src={connectImage} />
        </a>
      )}

      {loggedIn && (
        <>

         <h1>{JSON.stringify(authenticated)}</h1>

          <div className="nav-settings">
            <a href="/revoke-token">
              <input type="submit" className="select-input" value="Revoke Token" />
            </a>
          </div>
          <div className="nav-settings">
            {authenticated.allTenants.length > 1 && (
              <a href="/disconnect">
                <input type="submit" className="select-input" value="Disconnect Tenant" />
              </a>
            )}
          </div>
          <div className="nav-settings">
            <a href="/refresh-token">
              <input type="submit" className="select-input" value="Refresh Token" />
            </a>
          </div>
          <div className="nav-settings">
            <form onSubmit={(e) => handleOrgChange(e, authenticated.activeTenant)}>
              <select name="active_org_id" className="select-box">
                {authenticated.allTenants.map((tenant) => {
                  const selected = tenant.tenantId === authenticated.activeTenant.tenantId ? 'selected' : '';
                  return (
                    <option key={tenant.tenantId} selected={selected} value={tenant.tenantId}>
                      {tenant.tenantName}
                    </option>
                  );
                })}
              </select>
              <input type="submit" className="select-input" value="Change Org" />
            </form>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;