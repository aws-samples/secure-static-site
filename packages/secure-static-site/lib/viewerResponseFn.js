// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handler(event) {
  var response = event.response;
  var headers = response.headers;
  var additionalHeaders = JSON.parse(`{{ADDITIONAL_HEADERS}}`);

  // add additional headers
  Object.assign(headers, additionalHeaders);

  // Return the response to viewers
  return response;
}
