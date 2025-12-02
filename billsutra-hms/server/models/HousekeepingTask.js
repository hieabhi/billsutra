// Housekeeping Task Model
export const TASK_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED'
};

export const TASK_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};

export const TASK_TYPE = {
  CLEANING: 'CLEANING',
  INSPECTION: 'INSPECTION',
  MAINTENANCE: 'MAINTENANCE',
  TURNDOWN: 'TURNDOWN',
  DEEP_CLEAN: 'DEEP_CLEAN',
  LAUNDRY: 'LAUNDRY'
};

export class HousekeepingTask {
  constructor(data) {
    this.id = data.id || null;
    this.hotelId = data.hotelId; // Required for multi-tenancy
    this.roomId = data.roomId;
    this.roomNumber = data.roomNumber || '';
    this.type = data.type || TASK_TYPE.CLEANING;
    this.status = data.status || TASK_STATUS.PENDING;
    this.priority = data.priority || TASK_PRIORITY.MEDIUM;
    this.assignedTo = data.assignedTo || null; // User ID
    this.assignedToName = data.assignedToName || '';
    this.description = data.description || '';
    this.notes = data.notes || '';
    this.reportedIssues = data.reportedIssues || [];
    this.checklist = data.checklist || [];
    this.estimatedDuration = data.estimatedDuration || 30; // minutes
    this.actualDuration = data.actualDuration || null;
    this.startTime = data.startTime || null;
    this.completedTime = data.completedTime || null;
    this.verifiedBy = data.verifiedBy || null;
    this.verifiedTime = data.verifiedTime || null;
    this.nextArrivalTime = data.nextArrivalTime || null; // For priority calculation
    this.bookingId = data.bookingId || null; // If related to checkout
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  validate() {
    const errors = [];
    
    if (!this.hotelId) errors.push('Hotel ID is required');
    if (!this.roomId) errors.push('Room is required');
    if (!Object.values(TASK_TYPE).includes(this.type)) {
      errors.push(`Invalid type. Must be one of: ${Object.values(TASK_TYPE).join(', ')}`);
    }
    if (!Object.values(TASK_STATUS).includes(this.status)) {
      errors.push(`Invalid status. Must be one of: ${Object.values(TASK_STATUS).join(', ')}`);
    }
    if (!Object.values(TASK_PRIORITY).includes(this.priority)) {
      errors.push(`Invalid priority. Must be one of: ${Object.values(TASK_PRIORITY).join(', ')}`);
    }
    
    return errors;
  }

  isPending() {
    return this.status === TASK_STATUS.PENDING;
  }

  isCompleted() {
    return [TASK_STATUS.COMPLETED, TASK_STATUS.VERIFIED].includes(this.status);
  }

  canStart() {
    return this.status === TASK_STATUS.PENDING;
  }

  canComplete() {
    return this.status === TASK_STATUS.IN_PROGRESS;
  }

  calculatePriorityScore() {
    let score = 0;
    
    // Base score from priority
    const priorityScores = {
      [TASK_PRIORITY.LOW]: 1,
      [TASK_PRIORITY.MEDIUM]: 2,
      [TASK_PRIORITY.HIGH]: 3,
      [TASK_PRIORITY.URGENT]: 4
    };
    score += priorityScores[this.priority] || 0;
    
    // Boost score if there's an upcoming arrival
    if (this.nextArrivalTime) {
      const now = new Date();
      const arrival = new Date(this.nextArrivalTime);
      const hoursUntilArrival = (arrival - now) / (1000 * 60 * 60);
      
      if (hoursUntilArrival < 2) score += 5;
      else if (hoursUntilArrival < 4) score += 3;
      else if (hoursUntilArrival < 6) score += 1;
    }
    
    return score;
  }
}
