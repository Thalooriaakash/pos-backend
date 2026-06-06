const jwt = require("jsonwebtoken");

module.exports = (allowedRoles = []) => {

  return (req, res, next) => {

    try {

      const authHeader =
        req.headers.authorization;

      if (!authHeader) {

        return res.status(401).json({
          message: "No token"
        });
      }

      const token =
        authHeader.split(" ")[1];

      const decoded =
        jwt.verify(
          token,
          process.env.JWT_SECRET
        );

      
      req.user = decoded;

      // ROLE CHECK
      if (
        allowedRoles.length > 0 &&
        !allowedRoles.includes(
          decoded.role.toLowerCase()
        )
      ) {

        return res.status(403).json({
          message: "Access denied"
        });
      }

      next();

    } catch (err) {

      console.log(err);

      return res.status(401).json({
        message: "Invalid token"
      });
    }
  };
};