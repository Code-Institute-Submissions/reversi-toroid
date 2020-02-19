author: Pavel Zelenin
Code Institute
Full Stack Web Developer course
Milestone Project #2
(Interactive Frontend Development Milestone Project)

Reversi game (Classic and on-Toroid)
https://pavzel.github.io/reversi-toroid/

1. Overview
The main purpose of this project (Milestone Project #2) was to build an interactive front-end site.
The site demonstrates some of my skills in Javascript in the middle of February 2020.

This is a site with a game almost identical to the classic Reversi game ( https://en.wikipedia.org/wiki/Reversi ).
One can play either a classic version of Reversi or the Reversi-on-Toroid version.
In Reversi-on-Toroid, a toroid is used as a board instead of the standard square board. This means that
    1) the rightmost and leftmost verticals are treated as neighbours,
    2) the top and bottom horizontals are treated as neighbours.

A simple game mode: human vs. human. To be used, e.g., as a board game on the same device during travel.
An advanced mode: human vs. computer ("AI"). To be used by 1 human player.
Strength of AI can be chosen from 1 (random moves of AI) up to 2 (AI randomly selected among all valid moves with maximal possible gain after 1 move).

2. UX
The site was supposed to be used by me or my friends. That is why its design is minimal and includes only essential feratures.

3. Features
3.1. Existing Features
The site consists of 1 page. It includes:
    a) a menu with buttons "Restart" (to restart the game) and "Help" (for basic help),
    b) the game board,
    c) a game is started by one of 2 buttons (for "classic" and "toroid" versions),
       during a game, the current score and the game messages are displayed,
    d) a footer with my name, the year when the site was created, and my email address for contact.
A user can change playes' names by clicking on one of the score fields, typing a new name and pressing "OK".
If a user wants to play against computer ("AI") a new name should be "AI (level 1)" or "AI (level 2).

3.2. Features Left to Implement
In the future, it would be interesting to improve the AI (to make it maximize the gain after 2 moves, 3 moves, etc.).
For research purposes, one can add a "computer vs. computer" mode to compare different game algorhythms, and maybe for to develop new algorhythms.
For human users, "Top Scores" list can be added.
Design of the site can be made more artistic. Some animation and sound effects can be added.

4. Technologies Used
The project is written with HTML5, CSS3 and Javascript. jQuery is used for event handling and HTML manipulation.

5. Testing
The site was designed to be used mainly on mobile phones with a small display.
It was tested on a laptop Lenovo ThinkPad (with different window widths) and a mobile phone Motorola XT1941 4.
Both menu buttons were tested.
Both start buttons were tested.
The name change feature was tested for setting a new human player name and for choosing AI with level 1 or level 2.
The game was extensively played both "human vs. human" and "human vs. computer".

6. Deployment
The project is deployed to GitHub Pages (built from the master branch): https://pavzel.github.io/reversi-toroid/
The source files are publicly accessible: https://github.com/pavzel/reversi-toroid

7. Credits
The project idea was suggested by Code Institute. The classic game rules and the game history can be found here: https://en.wikipedia.org/wiki/Reversi