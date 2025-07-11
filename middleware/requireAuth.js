function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();           
  }

  const wantsJson =
    req.xhr ||
    req.headers.accept?.includes('application/json') ||
    req.headers['content-type'] === 'application/json'||
    req.headers['x-requested-with'] === 'XMLHttpRequest'; 

  if (wantsJson) {
    return res.status(401).json({ message: 'Please log in first' });
  }

  return res.redirect('/login');
}


module.exports = requireAuth;
