# Facility Management App

A comprehensive facility management application built with React frontend and Node.js backend, designed to help manage facility operations, consumption tracking, and resource monitoring.

## 🚀 Features

- **Consumption Tracking**: Monitor and track facility resource consumption
- **Real-time Statistics**: View consumption analytics and trends
- **Responsive Design**: Mobile-first design with modern UI/UX
- **Mock Data Support**: Works with or without database connection
- **RESTful API**: Clean API architecture for data management

## 🛠️ Tech Stack

### Frontend
- React 18
- TailwindCSS for styling
- Axios for API calls
- React Router for navigation

### Backend
- Node.js with Express
- MongoDB (optional - works with mock data)
- CORS enabled
- RESTful API architecture

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (optional)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd facility-management-app
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install client dependencies
   cd client
   npm install
   
   # Install server dependencies
   cd ../server
   npm install
   ```

3. **Environment Configuration**
   ```bash
   # Copy environment example
   cp .env.example .env
   
   # Edit .env file with your configuration
   # MongoDB connection is optional - app works with mock data
   ```

4. **Start the application**
   
   **Option 1: Start both client and server separately**
   ```bash
   # Terminal 1 - Start the backend server
   cd server
   npm start
   
   # Terminal 2 - Start the frontend client
   cd client
   npm start
   ```
   
   **Option 2: Start both from root (if configured)**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database (Optional - app works without MongoDB)
MONGODB_URI=mongodb://localhost:27017/facility-management

# Server Configuration
PORT=5000
NODE_ENV=development

# Client Configuration
CLIENT_URL=http://localhost:3000
```

## 📱 Usage

### Consumption Management
- View consumption data with pagination and filtering
- Search and sort consumption records
- View consumption statistics and analytics
- Add, edit, and delete consumption records

### API Endpoints

#### Consumption Routes
- `GET /api/consumption` - Get consumption data with pagination
- `GET /api/consumption/stats` - Get consumption statistics
- `GET /api/consumption/:id` - Get single consumption record
- `POST /api/consumption` - Create new consumption record
- `PUT /api/consumption/:id` - Update consumption record
- `DELETE /api/consumption/:id` - Delete consumption record

## 🏗️ Project Structure

```
facility-management-app/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   └── utils/         # Utility functions
│   ├── package.json
│   └── tailwind.config.js
├── server/                # Node.js backend
│   ├── routes/           # API routes
│   ├── models/           # Database models
│   ├── uploads/          # File uploads
│   ├── index.js          # Server entry point
│   └── package.json
├── .env.example          # Environment variables template
├── .gitignore
├── package.json          # Root package.json
└── README.md
```

## 🔄 Development Workflow

### Running in Development Mode
The application supports hot reloading for both frontend and backend during development.

### Mock Data
The application includes comprehensive mock data for development and testing purposes, allowing you to run the app without a database connection.

### CORS Configuration
The backend is configured to accept requests from `http://localhost:3000` by default.

## 🚀 Deployment

### Frontend Deployment
The React app can be deployed to platforms like Vercel, Netlify, or any static hosting service.

```bash
cd client
npm run build
```

### Backend Deployment
The Node.js server can be deployed to platforms like Heroku, Railway, or any cloud provider.

### Environment Variables for Production
Make sure to set appropriate environment variables for production:
- `NODE_ENV=production`
- `MONGODB_URI` (if using MongoDB)
- `CLIENT_URL` (your frontend URL)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   - Change the port in your environment variables
   - Kill the process using the port: `lsof -ti:3000 | xargs kill -9`

2. **MongoDB connection issues**
   - The app works without MongoDB using mock data
   - Check your MongoDB connection string in `.env`

3. **CORS errors**
   - Ensure the backend CORS configuration matches your frontend URL
   - Check that both servers are running on the correct ports

## 📞 Support

For support and questions, please open an issue in the GitHub repository.