
# 🎭 ScriptVoice - AI-Powered Script Editor

A Gradio-based web application that lets users write, edit, and bring their scripts to life with text-to-speech and AI assistance. Perfect for storytellers, content creators, and anyone who wants to hear their words come alive!

## 🚀 Features

### Core Functionality
- **📝 Script Editor**: Full-featured text editor with word count and reading time estimation
- **🔊 Text-to-Speech**: Convert your scripts to audio using Google TTS or pyttsx3
- **💾 Project Management**: Save and load multiple script projects
- **📝 Notes System**: Add project-specific notes and ideas

### AI-Powered Assistance
- **🤖 AI Chat**: Get suggestions and feedback on your scripts
- **⚡ Quick Actions**: 
  - ✨ Improve script flow and readability
  - 💕 Rewrite in romantic tone
  - 🎭 Add dramatic pauses for better TTS
  - 📖 Continue your story

### Voice Controls
- **🎵 Multiple TTS Engines**: Choose between Google TTS and pyttsx3
- **⚙️ Speed Control**: Adjust playback speed (0.5x to 2.0x)
- **📊 Real-time Stats**: Live word count, character count, and reading time

## 🛠️ Setup & Installation

### Local Development

1. **Clone or download the project files**
   ```bash
   # Make sure you have Python 3.8+
   python --version
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables (optional)**
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key for AI features
   ```

4. **Run the application**
   ```bash
   python app.py
   ```

5. **Open your browser**
   - Local: `http://localhost:7860`
   - Public link will be displayed in terminal

### HuggingFace Spaces Deployment

1. **Create a new Space on HuggingFace**
   - Go to [HuggingFace Spaces](https://huggingface.co/spaces)
   - Click "Create new Space"
   - Choose "Gradio" as the SDK

2. **Upload files**
   - `app.py` (main application)
   - `requirements.txt` (dependencies)
   - `README.md` (this file)

3. **Set environment variables (optional)**
   - In Space settings, add `OPENAI_API_KEY` for AI features

4. **Deploy**
   - Space will automatically build and deploy
   - Share the public URL!

## 📖 Usage Guide

### Getting Started
1. **Write Your Script**: Use the main text editor to write your script or story
2. **Add Notes**: Use the notes section for ideas, character details, or plot points
3. **Generate Audio**: Click "Generate & Play Audio" to hear your script
4. **Save Your Work**: Enter a project name and click "Save" to preserve your work

### AI Assistance
1. **Chat with AI**: Ask questions about your script in the chat interface
2. **Quick Actions**: Use the preset buttons for common improvements:
   - "Improve Script" - Get general writing suggestions
   - "Make Romantic" - Rewrite with romantic tone
   - "Add Drama" - Insert dramatic pauses and emphasis
   - "Continue Story" - Generate story continuation

### Voice Settings
- **Speed Control**: Adjust how fast the TTS reads your script
- **Engine Selection**: Choose between Google TTS (online) and pyttsx3 (offline)

## 🏗️ Technical Details

### Architecture
- **Frontend**: Gradio Blocks for responsive web interface
- **TTS Engines**: gTTS (Google) and pyttsx3 (offline)
- **AI Integration**: OpenAI GPT models via API
- **Data Storage**: JSON file storage for projects
- **Deployment**: HuggingFace Spaces compatible

### File Structure
```
├── app.py              # Main Gradio application
├── requirements.txt    # Python dependencies  
├── README.md          # Documentation
├── .env.example       # Environment template
└── projects.json      # Saved projects (auto-generated)
```

## 🚀 Hackathon Demo

**Track**: Agent Demo Track (#agent-demo-track)

This project demonstrates:
- **AI-Human Collaboration**: Writers work alongside AI for script improvement
- **Multi-Modal Output**: Text → Speech conversion for accessibility
- **Real-time Interaction**: Live word counting, instant TTS generation
- **Persistent Workflows**: Save/load projects for continued work

### Demo Flow
1. Open the app and write a short story or script
2. Use AI quick actions to improve the content
3. Generate audio to hear how it sounds
4. Save the project and load it later
5. Continue iterating with AI assistance

## 🔧 Development

### Adding New Features
- **New TTS Engine**: Add to the engine dropdown and create generation function
- **AI Prompts**: Add new quick action buttons and corresponding functions
- **Export Options**: Extend save functionality to support different formats

### Customization
- **Themes**: Modify the Gradio theme in `create_interface()`
- **Layout**: Adjust column scales and component arrangements
- **Styling**: Add custom CSS for branding

## 📝 License

Open source - feel free to fork, modify, and share!

## 🤝 Contributing

This is a hackathon demo project, but contributions and improvements are welcome!

---

**Made with ❤️ for storytellers and content creators**

*Transform your words into voice, your ideas into stories*
