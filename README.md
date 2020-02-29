### author: Pavel Zelenin
### Code Institute
### Full Stack Web Developer course
## Milestone Project #2
### (Interactive Frontend Development Milestone Project)

# Reversi game (Classic and on-Toroid)

https://pavzel.github.io/reversi-toroid/

## Overview
The main purpose of this project (Milestone Project #2) was to build an interactive front-end site.
The site demonstrates some of my skills in Javascript at the end of February 2020.

This is a site with a game almost identical to the classic [Reversi game]( https://en.wikipedia.org/wiki/Reversi ).
One can play either a classic version of Reversi or the Reversi-on-Toroid version.
In Reversi-on-Toroid, a toroid is used as a board instead of the standard square board. This means that:
1. the rightmost and leftmost verticals are treated as neighbours,
2. the top and bottom horizontals are treated as neighbours.\

There are 2 game modes:
* A simple game mode: human vs. human. To be used, e.g., as a board game on the same device during travel.
* An advanced mode: human vs. computer ("AI"). To be used by 1 human player.
Strength of AI can be chosen from 1 (random moves of AI) up to 2 (AI randomly selected among all valid moves with maximal possible gain after 1 move).

## UX
The site was supposed to be used by me or my friends. That is why its design is minimal and includes only essential feratures.\
### User stories:
* As a player, I want to click an always visible "menu" button, so that I can come back to the initial page.
* As a player, I want to click an always visible "menu" button, so that I can get help.
* As a player, I want to click a button on the initial page, so that I can start a new game on classic board.
* As a player, I want to click a button on the initial page, so that I can start a new game on toroid board.
* As a player, I want to click a player's score frame (that shows a hint), so that I can choose a new name instead of the default one for one of the two players.
* As a player, I want to choose an "AI-like" new name (that is displayed by default) when I click a player's score frame, so that I can choose a computer (AI) opponent instead of a human one.
* As a player, I want to get a warning message if the "AI" name is not valid, so that I can correct a mistake.
* As a player, I want to see a message saying which player must move, so that I (or my human opponent) can make a move.
* As a player, I want to click a square on the game board, so that I can make a move.
* As a player, I want to get a warning message if my move is not valid, so that I can correct a mistake.
* As a player, I want to see the current score, so that I can see who is winning.
* As a player, I want to get a message with the game's result, so that I can see who has won.

## Features
### Existing Features
The site consists of 2 pages: Home and Help.\
Home page includes:
1. a menu with buttons "Restart" (allows users to restart the game) and "Help" (allows users to go to Help page for basic help),
2. a welcome message (that disappears when a game starts),
3. 2 buttons (that disappear when a game starts) - one allows users to start a classic game, another allows users to start a toroid version of game,
4. a game board (appears when a game starts) - allows users to make moves by clicking on empty ("green") squares,
5. a score board (appears when a game starts) with players' names and current scores,
6. an input field for a new name (appears if a players' score is clicked) - allows changing the player's name (type a new name and press "OK") of to select AI instead of human (press "OK" to select a default AI of level 2, or before pressing "OK" change the level to 1 in the input field to have a weaker computer opponent),
7. a message board - where the game messages are displayed.\

Help page contains:
1. basic information about the game,
2. rules of the game,
3. instructions how to play.
A user can use a menu on top to jump to the section of interest.

### Features Left to Implement:
1. In the future, it would be interesting to improve the AI (to make it maximize the gain after 2 moves, 3 moves, etc.).
2. For research purposes, one can add a "computer vs. computer" mode to compare different game algorhythms, and maybe for to develop new algorhythms.
3. For human users, "Top Scores" list can be added.
4. Design of the site can be made more artistic. Some animation and sound effects can be added.

## Technologies Used
The project was written with HTML5, CSS3 and Javascript.\
[jQuery](https://jquery.com/) was used to simplify event handling and HTML manipulation.

## Testing
The site was designed to be used mainly on mobile phones with a small display.\
It was tested on a laptop Lenovo ThinkPad (with different window widths from 330px to 1466px) and a mobile phone Motorola XT1941 4.

Help button:
* Click the Help button on the initial page. The Help page is open in a new tab.

Help page menu:
* Click "About", "RUles", or "How to play" menu items. The text is moved so that the corresponding section get to the top of the page.
Both menu buttons were tested.\
Both start buttons were tested.\
The name change feature was tested for setting a new human player name and for choosing AI with level 1 or level 2.\
The game was extensively played both "human vs. human" and "human vs. computer".

## Deployment
The project is deployed to GitHub Pages (built from the master branch):\
https://pavzel.github.io/reversi-toroid/ \
The source files are publicly accessible:\
https://github.com/pavzel/reversi-toroid

## Credits
The project idea was suggested by Code Institute.\
The classic game rules and the game history can be found here:\
https://en.wikipedia.org/wiki/Reversi