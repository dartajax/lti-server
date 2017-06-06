'use strict';

//Inspiration and code from: https://github.com/atomicjolt/lti-lambda

const ltiAppUrl = 'https://d4jps70wc8ppm.cloudfront.net';

const launchResponse = ({event, lti, aws, eventToRequest, readSchoolConfig, findIliosUser, fetch, createJWT}) => {
  return new Promise((resolve, reject) => {
    const request = eventToRequest(event);
    const consumerKey = request.body.oauth_consumer_key;
    readSchoolConfig(consumerKey, aws).then(config => {
      const provider = new lti.Provider(consumerKey, config.consumerSecret);

      provider.valid_request(request, (error, isValid) => {
        if (isValid) {
          const searchString = request.body[config.ltiPostField];
          findIliosUser({fetch, createJWT, config, searchString}).then(userId => {
            const token = createJWT(userId, config.apiServer, config.apiNameSpace, config.iliosSecret);

            const targetUrl = `${ltiAppUrl}/login/${token}`;
            const response = {
              statusCode: 302,
              headers: {
                'Location': targetUrl
              },
              body: ''
            };
            resolve(response);
          });
        } else {
          reject(`Unable to validate request ${error}. Please ensure your consumer secret is correct.`);
        }
      });
    }, error => {
      reject(error);
    });
  });
};

module.exports = launchResponse;