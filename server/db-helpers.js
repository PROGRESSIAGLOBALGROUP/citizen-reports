/**
 * Helpers para manejo robusto de callbacks SQLite3
 * Resuelve race conditions y errores silenciosos
 */

export function safeDbCall(db, method, args, onSuccess, onError) {
  try {
    const callback = (err, result) => {
      if (err) {
        console.error(`❌ DB ${method} error:`, err.message);
        if (onError) onError(err);
      } else {
        if (onSuccess) onSuccess(result);
      }
    };
    
    if (method === 'all') {
      db.all(...args, callback);
    } else if (method === 'get') {
      db.get(...args, callback);
    } else if (method === 'run') {
      db.run(...args, callback);
    } else {
      throw new Error(`Unknown method: ${method}`);
    }
  } catch (err) {
    console.error(`❌ safeDbCall error:`, err.message);
    if (onError) onError(err);
  }
}

export function dbAll(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      db.all(sql, params, (err, rows) => {
        if (err) {
          console.error(`❌ dbAll error:`, err.message);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    } catch (err) {
      console.error(`❌ dbAll exception:`, err.message);
      reject(err);
    }
  });
}

export function dbGet(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      db.get(sql, params, (err, row) => {
        if (err) {
          console.error(`❌ dbGet error:`, err.message);
          reject(err);
        } else {
          resolve(row);
        }
      });
    } catch (err) {
      console.error(`❌ dbGet exception:`, err.message);
      reject(err);
    }
  });
}

export function dbRun(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      db.run(sql, params, function(err) {
        if (err) {
          console.error(`❌ dbRun error:`, err.message);
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    } catch (err) {
      console.error(`❌ dbRun exception:`, err.message);
      reject(err);
    }
  });
}
