import { getWorkload } from '../services/workloadService.js';

const getEmployeeWorkload = async (req, res) => {
  try {
    const workload = await getWorkload(req.user.id);
    res.json(workload);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export { getEmployeeWorkload };
