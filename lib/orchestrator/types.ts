/**
 * Universal Action Framework
 * Extensible action system for business process automation beyond APIs
 */

export interface UniversalAction {
  id: string;
  type: ActionType;
  category: ActionCategory;
  name: string;
  description: string;
  configuration: ActionConfig;
  dependencies: string[];
  parallel_group?: string;
  error_handling: ErrorHandlingStrategy;
  user_interaction?: UserInteractionConfig;
  ai_enhancement?: AIEnhancementConfig;
  memory_context?: MemoryContextConfig;
}

export enum ActionCategory {
  // Technical Actions
  API_CALL = 'api_call',
  DATABASE_OPERATION = 'database_operation',
  FILE_SYSTEM = 'file_system',
  EMAIL_AUTOMATION = 'email_automation',
  WEBHOOK_TRIGGER = 'webhook_trigger',
  
  // Business Process Actions
  APPROVAL_WORKFLOW = 'approval_workflow',
  DOCUMENT_GENERATION = 'document_generation',
  COMPLIANCE_CHECK = 'compliance_check',
  DECISION_LOGIC = 'decision_logic',
  DATA_VALIDATION = 'data_validation',
  
  // Human-Centric Actions
  USER_INPUT_REQUEST = 'user_input_request',
  TASK_ASSIGNMENT = 'task_assignment',
  NOTIFICATION_SEND = 'notification_send',
  MEETING_SCHEDULING = 'meeting_scheduling',
  FEEDBACK_COLLECTION = 'feedback_collection',
  
  // AI-Enhanced Actions
  CONTENT_ANALYSIS = 'content_analysis',
  SENTIMENT_EVALUATION = 'sentiment_evaluation',
  RISK_ASSESSMENT = 'risk_assessment',
  PREDICTIVE_MODELING = 'predictive_modeling',
  INTELLIGENT_ROUTING = 'intelligent_routing',
  
  // External Integration Actions
  CRM_OPERATIONS = 'crm_operations',
  ERP_INTEGRATION = 'erp_integration',
  ACCOUNTING_AUTOMATION = 'accounting_automation',
  LEGAL_COMPLIANCE = 'legal_compliance',
  HR_SYSTEMS = 'hr_systems',
  
  // Custom Business Actions
  CUSTOM_SCRIPT = 'custom_script',
  THIRD_PARTY_INTEGRATION = 'third_party_integration',
  BUSINESS_RULE_ENGINE = 'business_rule_engine'
}

export type ActionType = 
  | 'execute'
  | 'conditional'
  | 'parallel'
  | 'loop'
  | 'wait'
  | 'human_approval'
  | 'ai_decision'
  | 'data_transform';

export interface ActionConfig {
  // Core configuration
  timeout_minutes?: number;
  retry_attempts?: number;
  retry_delay_seconds?: number;
  
  // Action-specific configuration
  [key: string]: any;
}

export interface ErrorHandlingStrategy {
  strategy: 'fail_fast' | 'continue' | 'retry' | 'escalate' | 'alternative_path';
  max_retries?: number;
  retry_delay?: number;
  escalation_rules?: EscalationRule[];
  alternative_actions?: string[];
  notification_on_failure?: boolean;
}

export interface EscalationRule {
  condition: string;
  escalate_to: string[];
  notification_method: 'email' | 'slack' | 'sms' | 'dashboard';
  escalation_delay_minutes?: number;
}

export interface UserInteractionConfig {
  type: 'input' | 'approval' | 'selection' | 'upload' | 'review' | 'confirmation';
  prompt: string;
  required_fields?: FieldDefinition[];
  approval_chain?: ApprovalStep[];
  timeout_minutes?: number;
  escalation_rules?: EscalationRule[];
  conditional_logic?: ConditionalLogic[];
}

export interface FieldDefinition {
  name: string;
  type: 'text' | 'number' | 'date' | 'file' | 'select' | 'multiselect' | 'boolean';
  label: string;
  required: boolean;
  validation?: ValidationRule[];
  options?: SelectOption[];
  default_value?: any;
  help_text?: string;
}

export interface ValidationRule {
  type: 'min_length' | 'max_length' | 'regex' | 'custom';
  value: any;
  error_message: string;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ApprovalStep {
  approver_role: string;
  approver_users?: string[];
  required: boolean;
  timeout_hours?: number;
  auto_approve_conditions?: string[];
}

export interface ConditionalLogic {
  condition: string;
  then_action: string;
  else_action?: string;
}

export interface AIEnhancementConfig {
  enabled: boolean;
  model: string;
  prompt_template?: string;
  context_variables?: string[];
  output_format?: 'text' | 'json' | 'structured';
  confidence_threshold?: number;
  fallback_to_human?: boolean;
}

export interface MemoryContextConfig {
  store_execution_context: boolean;
  retrieve_historical_patterns: boolean;
  context_query?: string;
  memory_types?: string[];
  max_context_items?: number;
}

// Workflow Definition Types
export interface BusinessWorkflow {
  id: string;
  name: string;
  description: string;
  domain: BusinessDomain;
  version: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  
  // Workflow Structure
  actions: UniversalAction[];
  triggers: WorkflowTrigger[];
  variables: WorkflowVariable[];
  
  // Execution Configuration
  execution_mode: 'manual' | 'automatic' | 'scheduled';
  schedule?: ScheduleConfig;
  permissions: PermissionConfig;
  
  // AI and Memory Integration
  ai_optimization: boolean;
  memory_integration: boolean;
  learning_enabled: boolean;
  
  // Analytics and Monitoring
  sla_targets?: SLATarget[];
  monitoring_config?: MonitoringConfig;
}

export enum BusinessDomain {
  HR = 'hr',
  FINANCE = 'finance',
  SALES = 'sales',
  MARKETING = 'marketing',
  OPERATIONS = 'operations',
  LEGAL = 'legal',
  IT = 'it',
  CUSTOMER_SERVICE = 'customer_service',
  CUSTOM = 'custom'
}

export interface WorkflowTrigger {
  id: string;
  type: 'webhook' | 'schedule' | 'manual' | 'api_call' | 'file_upload' | 'email' | 'form_submission';
  configuration: {
    [key: string]: any;
  };
  conditions?: TriggerCondition[];
}

export interface TriggerCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'exists';
  value: any;
}

export interface WorkflowVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  default_value?: any;
  description: string;
  required: boolean;
  scope: 'workflow' | 'action' | 'global';
}

export interface ScheduleConfig {
  type: 'once' | 'recurring';
  start_date?: string;
  end_date?: string;
  recurrence_pattern?: RecurrencePattern;
  timezone: string;
}

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  days_of_week?: number[];
  day_of_month?: number;
  month_of_year?: number;
}

export interface PermissionConfig {
  execute_roles: string[];
  view_roles: string[];
  edit_roles: string[];
  admin_roles: string[];
}

export interface SLATarget {
  metric: 'completion_time' | 'success_rate' | 'user_satisfaction';
  target_value: number;
  threshold_warning: number;
  threshold_critical: number;
}

export interface MonitoringConfig {
  track_performance: boolean;
  alert_on_failure: boolean;
  log_level: 'minimal' | 'standard' | 'detailed';
  retention_days: number;
}

// Execution Context Types
export interface ExecutionContext {
  workflow_id: string;
  execution_id: string;
  user_id: string;
  organization_id: string;
  trigger_data?: any;
  input_variables?: Record<string, any>;
  execution_mode: 'manual' | 'automatic' | 'test';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  // AI and Memory Context
  historical_patterns?: HistoricalPattern[];
  memory_context?: MemoryContext[];
  ai_suggestions?: AISuggestion[];
}

export interface HistoricalPattern {
  pattern_type: string;
  occurrence_count: number;
  success_rate: number;
  average_duration: number;
  common_variations: string[];
}

export interface MemoryContext {
  memory_id: string;
  content: any;
  relevance_score: number;
  created_at: string;
  context_type: string;
}

export interface AISuggestion {
  suggestion_type: 'optimization' | 'error_prevention' | 'alternative_path';
  description: string;
  confidence_score: number;
  potential_impact: 'low' | 'medium' | 'high';
  implementation_effort: 'easy' | 'moderate' | 'complex';
}

// Execution Results Types
export interface ActionExecutionResult {
  action_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'waiting_approval';
  start_time: string;
  end_time?: string;
  duration_ms?: number;
  result_data?: any;
  error_message?: string;
  human_actions_required?: HumanActionRequired[];
  ai_insights?: AIInsight[];
  memory_stored?: MemoryReference[];
}

export interface HumanActionRequired {
  type: 'approval' | 'input' | 'review' | 'decision';
  description: string;
  assigned_to: string[];
  due_date?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  context_data?: any;
}

export interface AIInsight {
  insight_type: 'optimization' | 'anomaly' | 'pattern' | 'recommendation';
  description: string;
  confidence_score: number;
  supporting_data?: any;
  actionable_suggestions?: string[];
}

export interface MemoryReference {
  memory_id: string;
  memory_type: string;
  stored_content_summary: string;
  retrieval_query?: string;
}

export interface WorkflowExecutionResult {
  workflow_id: string;
  execution_id: string;
  status: 'completed' | 'failed' | 'partial' | 'waiting_human' | 'cancelled';
  start_time: string;
  end_time?: string;
  total_duration_ms?: number;
  
  // Action Results
  action_results: ActionExecutionResult[];
  failed_actions: string[];
  skipped_actions: string[];
  pending_human_actions: HumanActionRequired[];
  
  // Analytics and Insights
  performance_metrics: PerformanceMetrics;
  ai_insights: AIInsight[];
  optimization_suggestions: OptimizationSuggestion[];
  
  // Memory and Learning
  memories_created: MemoryReference[];
  patterns_learned: string[];
  context_applied: string[];
}

export interface PerformanceMetrics {
  total_actions: number;
  successful_actions: number;
  failed_actions: number;
  average_action_duration: number;
  total_api_calls: number;
  total_cost: number;
  sla_compliance: boolean;
  user_satisfaction_score?: number;
}

export interface OptimizationSuggestion {
  category: 'performance' | 'cost' | 'reliability' | 'user_experience';
  description: string;
  potential_improvement: string;
  implementation_complexity: 'easy' | 'moderate' | 'complex';
  estimated_impact: number; // percentage improvement
}

// Workflow Node for Visual Builder
export interface WorkflowNode {
  id: string;
  type: ActionCategory;
  position: { x: number; y: number };
  data: {
    label: string;
    configuration: any;
    validation_status: 'valid' | 'warning' | 'error';
    execution_status?: 'pending' | 'running' | 'completed' | 'failed';
  };
}