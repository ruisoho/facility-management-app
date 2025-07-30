# Facility Management App - SQLite Version

## 🎯 **Zero-Installation Database Solution**

This version uses **SQLite** instead of MongoDB, eliminating all database installation and configuration problems!

## ✅ **What's Changed**

- ❌ **Removed**: MongoDB dependency
- ✅ **Added**: SQLite database (file-based, no server required)
- ✅ **Added**: Automatic database initialization with sample data
- ✅ **Added**: All CRUD operations working with SQLite
- ✅ **Added**: Statistics and dashboard functionality

## 🚀 **Quick Start**

### 1. Install Dependencies
```bash
npm run install-all
```

### 2. Start the Application
```bash
npm run dev
```

### 3. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api

## 📁 **Database Location**

The SQLite database file is automatically created at:
```
server/data/facility_management.db
```

## 🔧 **Features Working**

✅ **Task Management**
- Create, read, update, delete tasks
- Filter by status, priority, category
- Search by responsible person
- Mark tasks as completed
- View overdue and upcoming tasks

✅ **Dashboard & Statistics**
- Task counts by status, priority, category
- Overdue and upcoming task counts
- Monthly completion statistics
- Responsible person breakdown

✅ **Data Persistence**
- All data saved to local SQLite file
- Survives application restarts
- No external database server required

## 📊 **Sample Data**

The application automatically creates sample tasks on first run:
- HVAC System Inspection (High Priority, In Progress)
- Electrical Panel Maintenance (Medium Priority, Pending)
- Fire Safety System Check (High Priority, Completed)

## 🛠️ **Technical Details**

### Database Schema
```sql
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority TEXT DEFAULT 'Medium',
  status TEXT DEFAULT 'Pending',
  deadline TEXT,
  finishedDate TEXT,
  responsible_type TEXT,
  responsible_name TEXT,
  responsible_contact TEXT,
  estimatedCost REAL,
  actualCost REAL,
  notes TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoints
- `GET /api/tasks` - List all tasks with filtering
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get single task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/complete` - Mark task as completed
- `GET /api/tasks/stats/overview` - Get task statistics

## 🎯 **Benefits of SQLite Version**

1. **Zero Installation**: No MongoDB server setup required
2. **Portable**: Database is a single file
3. **Fast**: SQLite is extremely fast for small to medium datasets
4. **Reliable**: ACID compliant, battle-tested database
5. **No Configuration**: Works out of the box
6. **Cross-Platform**: Works on Windows, Mac, Linux
7. **Backup Friendly**: Just copy the .db file

## 🔄 **Migration from MongoDB**

If you have existing MongoDB data, you can:
1. Export your MongoDB data to JSON
2. Create a migration script to import into SQLite
3. Or manually recreate your important data

## 📝 **Development Notes**

- Database file is created automatically on first run
- Sample data is inserted only if tables are empty
- All API responses maintain the same format as MongoDB version
- Frontend code requires no changes

## 🚀 **Production Deployment**

For production, you can:
1. Use SQLite for small to medium applications
2. Upgrade to PostgreSQL or MySQL for larger scale
3. Use cloud databases like Supabase or PlanetScale

## 🆘 **Troubleshooting**

### Database Issues
- Delete `server/data/facility_management.db` to reset database
- Check file permissions in `server/data/` directory

### Performance
- SQLite handles thousands of records efficiently
- For very large datasets (100k+ records), consider PostgreSQL

---

**🎉 Enjoy your installation-free facility management app!**