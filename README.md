### Overview

Automated completion for Education Perfect vocabulary tasks with learning capabilities.

### How to Set-up (MacOS)

1. Download Tampermonkey on Chrome Web Store
2. Go to ```Manage Extensions``` and enable ```Developer Mode```
3. Under the ```Details``` tab of the Tampermonkey widget, enable ```User Scripting```
4. Open the Tampermonkey Extension, press ```Create Script``` and paste the contents of the ```education_perfected.user.js``` file into it. Ensure that it is enabled.
5. Sign into Education Perfect and the custom UI should appear on the center right.

### How to Use

1. In the Custom UI, press the expand icon ```<``` to open the app.
2. Scroll down to the bottom of the Vocab list (to force EP to load all items) and then press the ```CREATE DICTIONARY``` button to set up your dictionary.
3. Press the inbuilt ```AUTOSOLVER``` tab, set your preferences, and hit ```START SOLVER```.
4. Spam the ```Enter``` Key

OR

1. Enable ```Non-Dictionary Solver``` and hit ```START SOLVER```.

### Features

The Program can:
- Match Dictionary terms to Questions provided by the Vocab Task
- Learn from dictonary mismatches (by leveragings EP's post-question answer correction)
- Reattempt to attain questions values. There is an automatic failsafe for failing to retrieve Question value.

You can choose for the program to:
- Use ```Bidirectional Dictionaries``` (Useful for Reading/Writing tasks as EP Vocab Dictionaries are uni-directional by default)
- ```Enable Autotyping``` (The program will attempt to spam the answer into the answer box. Disable it to manually overide the answer)
- Use ```Non-Dictionary``` mode (Advance Solver)

### Troubleshooting during usage

If the entire screen has the blue ```copy-text highlight```, simply press back into the answer textbox.

Note that you still need to press the enter key to cycle the questions. Due to the limites of program injection, you will need to manual press the button or organise an external Macro.

### Known Issues

Some teachers may attach multiple translations of the same word. The program may be continually stuck in an infinite self correction loop. Manual intervetion is needed. Stop the autosolver and complete it manually before re-enabling it.

### What's New in Version 3.5 and 3.6

- Improved Question Seeking for sub 50ms processing times per individual question
- Minor UI Bug Fixes
- Bidirectional Dictionaries is now enabled as a default setting
- [NEW] Added a Non-Dictionary Solver. No need to scrape dictionaries before use. Can be used for all vocab tasks including Listening Tasks.

Have Fun!