# Vibe - Universal API Warehouse

A comprehensive web application for managing, testing, and monitoring APIs and VPS servers. Built with Next.js and designed to be your central hub for all backend services.

## 🚀 Features

### 📡 API Management
- **Universal API Integration** - Add any REST API with simple configuration
- **Real-time API Testing** - Test endpoints with custom parameters
- **Response Analysis** - Beautiful JSON viewer and error handling
- **Multiple Auth Methods** - Support for API keys, Bearer tokens, OAuth, and more

### 🖥️ VPS Server Management
- **SSH Terminal** - Execute commands directly in your browser
- **File Manager** - Browse, upload, download, and manage server files
- **System Monitoring** - Real-time CPU, memory, disk, and network usage
- **Service Control** - Start, stop, and restart system services
- **Process Management** - View and manage running processes
- **Log Viewer** - Access system and application logs

### 🔧 Supported APIs
- **Picsart** - AI image generation and editing
- **OpenAI** - ChatGPT and DALL-E integration
- **GitHub** - Repository management
- **Stripe** - Payment processing
- **Namecheap** - Domain and SSL management
- **Weather APIs** - Real-time weather data
- **Custom APIs** - Easy integration for any REST API

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **State Management**: SWR for data fetching
- **Authentication**: Built-in auth system
- **Deployment**: Vercel-ready
- **Database**: Drizzle ORM with PostgreSQL

## 🚀 Quick Start

### Local Development

1. **Clone and install dependencies:**
```bash
git clone https://github.com/thefixer3x/vibe-frontend.git
cd vibe-frontend
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env.local
# Add your API keys and configuration
```

3. **Run the development server:**
```bash
npm run dev
```

4. **Open your browser:**
Visit [http://localhost:3000](http://localhost:3000)

### Deployment to Vercel

1. **Deploy with Vercel CLI:**
```bash
vercel
```

2. **Configure environment variables in Vercel dashboard:**
- `PICSART_API_KEY`
- `OPENAI_API_KEY`
- `GITHUB_TOKEN`
- `STRIPE_SECRET_KEY`
- And any other API keys you want to use

## 📖 Usage

### API Warehouse
Navigate to `/dashboard/apis` to:
- View all configured APIs
- Test API endpoints with custom parameters
- View real-time responses and error handling
- Manage API configurations

### VPS Management
Navigate to `/dashboard/apis/server` to:
- Monitor server resources (CPU, memory, disk, network)
- Execute SSH commands through the web terminal
- Browse and manage server files
- Control system services
- View system logs and processes

### Adding New APIs
1. Create a YAML configuration file for your API
2. Place it in the Universal API Server configs folder
3. Restart the API server
4. Your new API will automatically appear in the interface

## 🔐 Security

- Environment variables for sensitive data
- Secure headers configuration
- Input validation and sanitization
- CSRF protection
- Rate limiting (when configured)

## 🤝 Contributing

This is a personal project, but contributions are welcome! Please feel free to submit issues and enhancement requests.

## 📝 License

MIT License - feel free to use this project for your own needs.

## 🙏 Acknowledgments

- Built on the excellent [Next.js]
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide React](https://lucide.dev/)

---

**Vibe** - Your universal API and server management hub! 🎯
