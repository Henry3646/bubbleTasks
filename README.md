# Bubble Tasks 🫧✅

A delightful task management app that turns your to-dos into playful bubbles! Manage tasks through satisfying interactions with physics-based bubbles that make productivity fun.

![Bubble Tasks Header Image](https://via.placeholder.com/800x400.png?text=Bubble+Tasks+Demo+Shot)

## Features ✨

- **Priority Color Coding**  
  Tasks automatically get colored bubbles based on priority (1-5):
  - 🔵 Priority 1 (Blue)
  - 🟣 Priority 2 (Purple)
  - 🟢 Priority 3 (Green)
  - 🟠 Priority 4 (Orange)
  - 🔴 Priority 5 (Red)
  
- **Playful Interaction**  
  ↕️ Drag bubbles anywhere on screen  
  🎮 Toss them with physics-based movement  
  💥 Pop bubbles with 2-second long-press  
  👆 Single-tap to view details

- **Haptic Feedback**  
  📳 Feel subtle vibrations on:  
  - Initial bubble press  
  - Successful bubble pop

- **Satisfying Completion**  
  ✨ Playful creation/deletion animations  
  🌈 Color-coded priority system  
  🎶 Sound effects (coming soon!)

## Usage Guide 📲

### Creating Tasks
1. Tap ➕ button in top right
2. Enter task details in modal:
   - Title (required)
   - Description
   - Priority Buttons (1-5)
3. Tap "Save" to create bubble

### Managing Tasks
- **View Details**  
  👆 Single-tap any bubble to open detail modal

- **Drag & Drop**  
  👆 Long-press and drag to reposition

- **Delete Tasks**  
  ⏳ Long-press any bubble for 2 seconds:  
  1. Immediate haptic feedback  
  2. Pop animation at 2 seconds  
  3. Task permanently removed

## Technical Details ⚙️

**Built With:**
- React Native
- Expo
- TypeScript
- React Native Reanimated (gestures/physics)
- Expo Haptics
- React Navigation (modals)

**Architecture:**
app/
├── index.tsx # Main application entry
components/
├── TaskBubble.tsx # Animated bubble component
├── TaskDetail.tsx # Bubble description modal
└── TaskModal.tsx # Task creation form

## Contributing 🤝

We welcome contributions! Please:
1. Open an issue to discuss changes
2. Fork the repository
3. Create a feature branch (`git checkout -b feature/amazing-feature`)
4. Commit changes (`git commit -m 'Add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License 📄

MIT License - see [LICENSE.md](LICENSE.md) for details

---

Made with ❤️ by Henry Arlt - *Turning task management into bubble therapy!*