import { db, writeDb } from "../config/db.js";

export class BaseRepository {
  constructor(collection) {
    this.collection = collection;
  }

  all() {
    return db.data[this.collection] || [];
  }

  findById(id) {
    return this.all().find((item) => item.id === id);
  }

  async insert(record) {
    db.data[this.collection].push(record);
    await writeDb();
    return record;
  }

  async update(id, updater) {
    const item = this.findById(id);
    if (!item) return null;
    updater(item);
    item.updatedAt = new Date().toISOString();
    await writeDb();
    return item;
  }
}
