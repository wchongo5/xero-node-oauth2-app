import React from 'react';
import { Helmet } from 'react-helmet';

const Head = ({ children }) => {
  return (
    <>
      <Helmet>
        <title>xero-node SDK tutorial</title>
        <link rel="shortcut icon" href="https://www.xero.com/etc/designs/xero-cms/clientlib/assets/img/favicon.ico" />
        <link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/highlight.js/9.15.10/styles/default.min.css" />
      </Helmet>
      {children}
      <script src="//cdnjs.cloudflare.com/ajax/libs/highlight.js/9.15.10/highlight.min.js"></script>
      <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js" integrity="sha256-4+XzXVhsDmqanXGHaHvgh1gMQKX40OUvDEBTu8JcmNs=" crossorigin="anonymous"></script>
      <script>hljs.initHighlightingOnLoad();</script>
    </>
  );
};

export default Head;