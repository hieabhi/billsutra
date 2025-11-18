// Floor Model
export class Floor {
  constructor(data) {
    this.id = data.id || `floor-${Date.now()}`;
    this.hotelId = data.hotelId;
    this.name = data.name;
    this.number = data.number;
    this.displayOrder = data.displayOrder || data.number;
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  validate() {
    if (!this.hotelId) throw new Error('Hotel ID is required');
    if (!this.name) throw new Error('Floor name is required');
    if (this.number === undefined) throw new Error('Floor number is required');
    return true;
  }
}
