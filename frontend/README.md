# Research Assistant AI - Frontend

A modern, professional web application for AI-powered research assistance with advanced features for article search, summarization, and history management.

## Features

### 🔍 **Enhanced Search & Results**
- **Professional Article Display**: Each research article shows comprehensive details including:
  - Article title with professional formatting
  - Source/journal name
  - Publication year
  - Citation count (e.g., "Cited by 1,247")
  - Detailed abstract/description
- **Smart Search**: Intelligent query processing with fallback to sample data for demonstration

### 📚 **Advanced Sidebar**
- **Collapsible Design**: Toggle sidebar width for better space utilization
- **Auto-Update**: Search history automatically updates without manual refresh
- **Professional Icons**: Clean, simple icons without distracting colors
- **Real-time History**: New searches automatically appear in sidebar

### 📄 **PDF Summary Generation**
- **AI-Powered Summaries**: Generate comprehensive article summaries
- **Professional PDF Export**: Download summaries in properly formatted PDF format
- **Modal Interface**: Clean popup interface with close functionality
- **Fallback Support**: Text download if PDF generation fails

### 🎨 **Professional UI/UX**
- **Clean Design**: Modern, professional appearance without funky elements
- **Simple Icons**: Plain, monochrome icons for better readability
- **Responsive Layout**: Works seamlessly on all device sizes
- **Professional Color Scheme**: Consistent with academic/research applications

### 🔒 **Search Control**
- **History Mode**: Search is automatically disabled when viewing history items
- **User Feedback**: Clear indication when search is disabled
- **Seamless Navigation**: Easy switching between search and history modes

## Technical Implementation

### **Dependencies**
- Next.js 15.4.4
- React 19.1.0
- TypeScript
- jsPDF + html2canvas for PDF generation
- Supabase for authentication and data storage

### **Key Components**
- **Main Page**: Central search interface with results display
- **Sidebar**: Collapsible history management
- **Summary Modal**: PDF generation interface
- **Professional Icons**: CSS-based icon system

### **Database Integration**
- Automatic search history storage
- Error handling for database operations
- User authentication integration

## Getting Started

1. **Install Dependencies**
```bash
npm install
```

2. **Environment Setup**
   - Configure Supabase credentials
   - Set up backend API endpoint

3. **Run Development Server**
```bash
npm run dev
```

4. **Build for Production**
```bash
npm run build
npm start
```

## Usage

### **Basic Search**
1. Enter your research query in the search bar
2. Click "Search" to find relevant articles
3. View detailed results with source, year, and citation information

### **Article Summary**
1. Click "Summary" button on any article
2. Wait for AI-generated summary
3. Download as PDF or text file

### **History Management**
1. View search history in the collapsible sidebar
2. Click on history items to reload previous results
3. Search is automatically disabled in history mode

### **Sidebar Control**
1. Use the collapse button (←/→) to toggle sidebar width
2. History automatically updates with new searches
3. No manual refresh required

## Design Philosophy

- **Professional Appearance**: Clean, academic-focused design
- **Simple Icons**: Plain, monochrome icons for clarity
- **User Control**: Clear feedback and intuitive interactions
- **Responsive Design**: Works on all devices and screen sizes

## Future Enhancements

- Real AI integration for summary generation
- Advanced filtering and sorting options
- Citation management tools
- Research collaboration features
- Export to various academic formats
