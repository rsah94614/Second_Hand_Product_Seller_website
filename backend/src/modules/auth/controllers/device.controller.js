const Device = require('../../../../models/Device');

const getDevices = async (req, res) => {
  try {
    const devices = await Device.find({ userId: req.user._id, isActive: true })
      .select('-__v')
      .sort({ lastUsedAt: -1 });

    return res.json({
      message: 'Devices retrieved successfully',
      devices,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const removeDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;

    const device = await Device.findOne({
      _id: deviceId,
      userId: req.user._id,
    });

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    device.isActive = false;
    await device.save();

    return res.json({ message: 'Device removed successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const logoutFromDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;

    const device = await Device.findOne({
      _id: deviceId,
      userId: req.user._id,
    });

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    device.isActive = false;
    await device.save();

    return res.json({ message: 'Logged out from device successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const trustDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;

    const device = await Device.findOne({
      _id: deviceId,
      userId: req.user._id,
    });

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    device.isTrusted = true;
    await device.save();

    return res.json({
      message: 'Device marked as trusted',
      device,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDevices,
  removeDevice,
  logoutFromDevice,
  trustDevice,
};
