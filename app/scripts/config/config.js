module.exports = {
  target: process.env.DAAC_NAME || 'local',
  environment: process.env.STAGE || 'production',
  nav: {
    order: ['collections'],
    exclude: {
      'pdrs': process.env.HIDE_PDR || true
    }
  },
  apiRoot: process.env.APIROOT || 'https://2dt9ujwdx6.execute-api.us-east-1.amazonaws.com/dev/',
  // 'https://ookuzc2c5c.execute-api.us-east-1.amazonaws.com/dev/', works
  // 'https://jedlmowssj.execute-api.us-east-1.amazonaws.com/dev/',
  // 'https://b834sudyke.execute-api.us-east-1.amazonaws.com/dev/',
  // 'https://jedlmowssj.execute-api.us-east-1.amazonaws.com/dev/', mine/OLD
  // 'https://example.com',
  graphicsPath: (process.env.BUCKET || '') + '/graphics/'

};
