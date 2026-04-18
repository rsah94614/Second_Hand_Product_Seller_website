/**
 * Rule Engine Service (Task 2.5.2)
 * Automated moderation rules for auto-flagging/suspending
 */

const Rule = require('../../models/Rule');
const ModerationQueue = require('../../models/ModerationQueue');

/**
 * Check item against all active rules
 * @param {Object} item - The item to check (product, user, etc.)
 * @param {String} itemType - Type of item ('product', 'user', 'order', 'review')
 * @returns {Array} - Array of matched rules
 */
const checkRules = async (item, itemType) => {
  try {
    // Get all active rules that apply to this item type
    const rules = await Rule.find({
      isActive: true,
      appliesTo: itemType,
    }).lean();

    const matchedRules = [];

    for (const rule of rules) {
      const matches = await evaluateRule(rule, item, itemType);
      if (matches) {
        matchedRules.push(rule);
      }
    }

    return matchedRules;
  } catch (error) {
    console.error('Error checking rules:', error);
    return [];
  }
};

/**
 * Evaluate a single rule against an item
 * @param {Object} rule - The rule to evaluate
 * @param {Object} item - The item to check
 * @param {String} itemType - Type of item
 * @returns {Boolean} - True if rule matches
 */
const evaluateRule = async (rule, item, itemType) => {
  try {
    switch (rule.type) {
      case 'keyword':
        return evaluateKeywordRule(rule, item, itemType);
      case 'pattern':
        return evaluatePatternRule(rule, item, itemType);
      case 'behavior':
        return evaluateBehaviorRule(rule, item, itemType);
      default:
        return false;
    }
  } catch (error) {
    console.error(`Error evaluating rule ${rule.name}:`, error);
    return false;
  }
};

/**
 * Evaluate keyword rule (exact match or contains)
 */
const evaluateKeywordRule = (rule, item, itemType) => {
  const keywords = rule.condition.toLowerCase().split(',').map(k => k.trim());
  
  if (itemType === 'product') {
    const title = (item.title || '').toLowerCase();
    const description = (item.description || '').toLowerCase();
    
    return keywords.some(keyword => 
      title.includes(keyword) || description.includes(keyword)
    );
  }
  
  if (itemType === 'user') {
    const name = (item.name || '').toLowerCase();
    const bio = (item.bio || '').toLowerCase();
    
    return keywords.some(keyword => 
      name.includes(keyword) || bio.includes(keyword)
    );
  }
  
  return false;
};

/**
 * Evaluate pattern rule (regex match)
 */
const evaluatePatternRule = (rule, item, itemType) => {
  try {
    const regex = new RegExp(rule.condition, 'i');
    
    if (itemType === 'product') {
      const title = item.title || '';
      const description = item.description || '';
      
      return regex.test(title) || regex.test(description);
    }
    
    if (itemType === 'user') {
      const name = item.name || '';
      const bio = item.bio || '';
      
      return regex.test(name) || regex.test(bio);
    }
    
    return false;
  } catch (error) {
    console.error('Invalid regex pattern:', rule.condition);
    return false;
  }
};

/**
 * Evaluate behavior rule (based on metrics)
 */
const evaluateBehaviorRule = (rule, item, itemType) => {
  try {
    // Parse condition like "riskScore >= 40" or "reportCount >= 5"
    const match = rule.condition.match(/^(\w+)\s*(>=|<=|>|<|==|!=)\s*(\d+)$/);
    
    if (!match) {
      console.error('Invalid behavior rule condition:', rule.condition);
      return false;
    }
    
    const [, field, operator, valueStr] = match;
    const value = parseFloat(valueStr);
    const itemValue = item[field];
    
    if (itemValue === undefined || itemValue === null) {
      return false;
    }
    
    switch (operator) {
      case '>=':
        return itemValue >= value;
      case '<=':
        return itemValue <= value;
      case '>':
        return itemValue > value;
      case '<':
        return itemValue < value;
      case '==':
        return itemValue == value;
      case '!=':
        return itemValue != value;
      default:
        return false;
    }
  } catch (error) {
    console.error('Error evaluating behavior rule:', error);
    return false;
  }
};

/**
 * Apply rule action to item
 * @param {Object} rule - The rule to apply
 * @param {Object} item - The item to apply rule to
 * @param {String} itemType - Type of item
 * @returns {Object} - Result of action
 */
const applyRule = async (rule, item, itemType) => {
  try {
    const result = {
      rule: rule.name,
      action: rule.action,
      applied: false,
      message: '',
    };

    switch (rule.action) {
      case 'flag':
        // Add risk flag to item
        if (!item.riskFlags) {
          item.riskFlags = [];
        }
        
        item.riskFlags.push({
          type: 'automated_rule',
          reason: rule.name,
          severity: rule.severity,
          detectedAt: new Date(),
        });
        
        result.applied = true;
        result.message = `Item flagged by rule: ${rule.name}`;
        break;

      case 'queue':
        // Add to moderation queue
        await ModerationQueue.create({
          itemType,
          itemId: item._id,
          reason: `Automated rule: ${rule.name}`,
          priority: rule.severity,
          metadata: {
            ruleId: rule._id,
            ruleName: rule.name,
            ruleType: rule.type,
          },
        });
        
        result.applied = true;
        result.message = `Item added to moderation queue by rule: ${rule.name}`;
        break;

      case 'suspend':
        // Suspend item (set inactive or suspended flag)
        if (itemType === 'product') {
          item.isActive = false;
          item.suspendedReason = `Automated rule: ${rule.name}`;
        } else if (itemType === 'user') {
          item.isSuspended = true;
          item.suspendedReason = `Automated rule: ${rule.name}`;
          item.suspendedAt = new Date();
        }
        
        result.applied = true;
        result.message = `Item suspended by rule: ${rule.name}`;
        break;

      case 'delete':
        // Mark for deletion (don't actually delete, just flag)
        if (!item.riskFlags) {
          item.riskFlags = [];
        }
        
        item.riskFlags.push({
          type: 'marked_for_deletion',
          reason: rule.name,
          severity: 'high',
          detectedAt: new Date(),
        });
        
        // Also add to moderation queue for admin review
        await ModerationQueue.create({
          itemType,
          itemId: item._id,
          reason: `Marked for deletion by rule: ${rule.name}`,
          priority: 'high',
          metadata: {
            ruleId: rule._id,
            ruleName: rule.name,
            action: 'delete',
          },
        });
        
        result.applied = true;
        result.message = `Item marked for deletion by rule: ${rule.name}`;
        break;

      default:
        result.message = `Unknown action: ${rule.action}`;
    }

    return result;
  } catch (error) {
    console.error('Error applying rule:', error);
    return {
      rule: rule.name,
      action: rule.action,
      applied: false,
      message: error.message,
    };
  }
};

/**
 * Check and apply all rules to an item
 * @param {Object} item - The item to check
 * @param {String} itemType - Type of item
 * @returns {Array} - Array of applied rule results
 */
const checkAndApplyRules = async (item, itemType) => {
  try {
    const matchedRules = await checkRules(item, itemType);
    const results = [];

    for (const rule of matchedRules) {
      const result = await applyRule(rule, item, itemType);
      results.push(result);
    }

    return results;
  } catch (error) {
    console.error('Error checking and applying rules:', error);
    return [];
  }
};

module.exports = {
  checkRules,
  evaluateRule,
  applyRule,
  checkAndApplyRules,
};
