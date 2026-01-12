# Riddles Folder

This folder contains riddles for the game in JSON format.

## File Structure

- `riddles.json` - Main riddles file containing all riddles
- `RiddleManager.js` - Manager class that loads and handles riddles

## Adding Riddles

To add new riddles, edit `riddles.json` and add new riddle objects to the `riddles` array.

### Riddle Format

Each riddle should follow this structure:

```json
{
  "id": "riddle_XXX",           // Unique identifier (required)
  "question": "Your riddle question here?",  // The riddle text (required)
  "answers": [                  // Array of possible answers (required, minimum 2)
    "Answer option 1",
    "Answer option 2",
    "Answer option 3",
    "Answer option 4"
  ],
  "correctAnswer": 0,          // Index of correct answer (0-based) (required)
  "hint": "Optional hint text" // Optional hint (not currently displayed in UI)
}
```

### Example

```json
{
  "id": "riddle_011",
  "question": "What has a face and two hands but no arms or legs?",
  "answers": [
    "A clock",
    "A person",
    "A robot",
    "A statue"
  ],
  "correctAnswer": 0,
  "hint": "It tells you the time"
}
```

## How It Works

1. The `RiddleManager` loads all riddles from `riddles.json` when the game starts
2. When a player hits a gate, a random riddle is selected (that hasn't been used recently)
3. Answers are shuffled for variety
4. Once all riddles are used, the system resets and starts over

## Notes

- Riddles are randomly selected, so players won't see the same riddle twice until all have been used
- Answers are automatically shuffled when displayed
- The game supports 2-4 answer options (displayed in a 2x2 grid if 4 answers)
- Make sure `correctAnswer` index matches the position in the `answers` array (0-based indexing)
