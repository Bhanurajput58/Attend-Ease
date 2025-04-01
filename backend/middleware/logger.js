// Logger middleware for debugging API requests
const logger = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  
  // Log request body for non-GET requests
  if (req.method !== 'GET' && req.body) {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  
  // Log request headers
  console.log('Request headers:', {
    authorization: req.headers.authorization ? 'Bearer [FILTERED]' : 'Not provided',
    'content-type': req.headers['content-type'],
    'user-agent': req.headers['user-agent']
  });
  
  // Capture the original response.send
  const originalSend = res.send;
  
  // Override the response.send function
  res.send = function(body) {
    // Log response if it's JSON
    if (res.getHeader('content-type')?.includes('application/json')) {
      try {
        const responseBody = typeof body === 'string' ? JSON.parse(body) : body;
        console.log(`Response to ${req.method} ${req.originalUrl}:`, 
          JSON.stringify({
            status: res.statusCode,
            success: responseBody.success,
            dataLength: responseBody.data ? 
              (Array.isArray(responseBody.data) ? responseBody.data.length : 'object') 
              : null
          }, null, 2)
        );
      } catch (err) {
        console.log(`Error parsing response: ${err.message}`);
      }
    }
    
    // Call the original send function
    originalSend.apply(res, arguments);
  };
  
  next();
};

module.exports = logger; 