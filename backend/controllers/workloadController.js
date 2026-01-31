const { getWorkload } = require('../services/workloadService');

const getEmployeeWorkload = async (req, res) => {
  try {
    const userId = req.user.id;           // from JWT
    const workload = await getWorkload(userId);
    res.json(workload);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getEmployeeWorkload };