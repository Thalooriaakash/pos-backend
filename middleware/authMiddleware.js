const jwt = require("jsonwebtoken");

module.exports = (roles = []) => {
    return (req, res, next) => {

        const authHeader = req.headers.authorization;

        // ❌ No header
        if (!authHeader) {
            return res.status(401).json({ message: "No token" });
        }

        // 🔥 Extract token
        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "No token" });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // ✅ FIX: normalize role (VERY IMPORTANT)
            const userRole = decoded.role?.toLowerCase().trim();

            console.log("USER ROLE:", userRole);
            console.log("ALLOWED ROLES:", roles);

            // ❌ Role check
            if (roles.length && !roles.includes(userRole)) {
                return res.status(403).json({ message: "Access denied" });
            }

            // ✅ attach user
            req.user = {
                ...decoded,
                role: userRole
            };

            next();

        } catch (err) {
            console.error("TOKEN ERROR:", err);
            return res.status(401).json({ message: "Invalid token" });
        }
    };
};