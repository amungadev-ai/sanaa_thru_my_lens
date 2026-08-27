#!/bin/bash
export DATABASE_URL="mysql://jobready_sanaa_test_admin:Admin254@d7.my-control-panel.com:3306/jobready_sanaa_test?connection_limit=2"
export AUTH_SECRET="sanaa-thrumylens-dev-secret-change-in-prod"
export CDN_URL="https://cdn.sanaathrumylens.co.ke"
export CDN_API_KEY="Uu8fNfxbBt5N98PthuFT89KHE9enMxBg"
export NODE_OPTIONS="--max-old-space-size=1280"
cd /home/z/my-project
exec /home/z/my-project/node_modules/.bin/next dev -p 3000 --webpack
