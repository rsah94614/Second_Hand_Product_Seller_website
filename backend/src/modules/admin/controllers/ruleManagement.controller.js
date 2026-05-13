const Rule = require('../../../../models/Rule');
const { logAuditAction } = require('../../../shared/utils/audit.utils');

const getRules = async (req, res) => {
  try {
    const { isActive, type } = req.query;
    const query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (type) query.type = type;

    const rules = await Rule.find(query).populate('createdBy', 'name email').sort({ createdAt: -1 });
    return res.json({ rules });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const createRule = async (req, res) => {
  try {
    const { name, description, type, condition, action, severity, appliesTo, metadata } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Rule name is required' });
    if (!type || !['keyword', 'pattern', 'behavior'].includes(type)) return res.status(400).json({ message: 'Invalid rule type' });
    if (!condition?.trim()) return res.status(400).json({ message: 'Rule condition is required' });
    if (!action || !['flag', 'suspend', 'delete', 'queue'].includes(action)) return res.status(400).json({ message: 'Invalid rule action' });

    const rule = await Rule.create({
      name: name.trim(),
      description: description?.trim() || '',
      type,
      condition: condition.trim(),
      action,
      severity: severity || 'medium',
      appliesTo: appliesTo || ['product'],
      metadata: metadata || {},
      createdBy: req.user._id,
    });

    const populatedRule = await Rule.findById(rule._id).populate('createdBy', 'name email');
    await logAuditAction({ action: 'RULE_CREATED', actor: req.user._id, targetType: 'Rule', targetId: rule._id, details: { name, type, action }, req });

    return res.status(201).json({ message: 'Rule created successfully', rule: populatedRule });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateRule = async (req, res) => {
  try {
    const { name, description, condition, action, severity, appliesTo, metadata } = req.body;
    const rule = await Rule.findById(req.params.id);
    if (!rule) return res.status(404).json({ message: 'Rule not found' });

    if (name?.trim()) rule.name = name.trim();
    if (description !== undefined) rule.description = description.trim();
    if (condition?.trim()) rule.condition = condition.trim();
    if (action && ['flag', 'suspend', 'delete', 'queue'].includes(action)) rule.action = action;
    if (severity && ['low', 'medium', 'high'].includes(severity)) rule.severity = severity;
    if (appliesTo) rule.appliesTo = appliesTo;
    if (metadata) rule.metadata = metadata;

    await rule.save();
    const populatedRule = await Rule.findById(rule._id).populate('createdBy', 'name email');
    await logAuditAction({ action: 'RULE_UPDATED', actor: req.user._id, targetType: 'Rule', targetId: rule._id, details: { name: rule.name }, req });

    return res.json({ message: 'Rule updated successfully', rule: populatedRule });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteRule = async (req, res) => {
  try {
    const rule = await Rule.findById(req.params.id);
    if (!rule) return res.status(404).json({ message: 'Rule not found' });

    await Rule.findByIdAndDelete(req.params.id);
    await logAuditAction({ action: 'RULE_DELETED', actor: req.user._id, targetType: 'Rule', targetId: req.params.id, details: { name: rule.name }, req });

    return res.json({ message: 'Rule deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const toggleRule = async (req, res) => {
  try {
    const rule = await Rule.findById(req.params.id);
    if (!rule) return res.status(404).json({ message: 'Rule not found' });

    rule.isActive = !rule.isActive;
    await rule.save();
    const populatedRule = await Rule.findById(rule._id).populate('createdBy', 'name email');
    await logAuditAction({ action: rule.isActive ? 'RULE_ENABLED' : 'RULE_DISABLED', actor: req.user._id, targetType: 'Rule', targetId: rule._id, details: { name: rule.name, isActive: rule.isActive }, req });

    return res.json({ message: `Rule ${rule.isActive ? 'enabled' : 'disabled'} successfully`, rule: populatedRule });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { getRules, createRule, updateRule, deleteRule, toggleRule };
