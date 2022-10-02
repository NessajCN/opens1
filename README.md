# OpenS1 VSCode extension
This extension is for S1ers to have a convenient way of viewing the forum when coding.

[Extension Link](https://marketplace.visualstudio.com/items?itemName=nessaj.opens1)

## Features

As an alpha version, OpenS1 is now capable of 
 - Viewing threads 
 - Posting threads 
 - submitting replies.

Addtional features could be added in future releases. (or not ...)


## Requirements

If you are a Linux user, you may have to install some dependency to use `keytar`.
e.g in Ubuntu:
```
sudo apt install libsecret-1-dev
```
in RedHat distros:
```
sudo yum install libsecret-devel
```
in Arch Linux:
```
sudo pacman -S libsecret
```


## Extension Settings

Configurations have not been contributed. I'll add them soon.

## Known Issues

To be tested.

## Release Notes

The extension is in early Alpha version.

## 0.3.2 - 2022-10-1

- Optimize disguised thread style.

- Change the thread content provider from archiver to normal forum.

## 0.3.1 - 2022-10-1

- Bug fix of displaying posts and replies.



## 0.3.0 - 2022-10-1

- Add member info display on mouse hover for disguised display style.



## Features incoming

- Direct messaging between OpenS1 users.
- Group chatting among OpenS1 users.
- File sharing with other OpenS1 users.

---

## Extension guidelines

 - The S1 thread list will be displayed at the bottom left of explorer view. 

 - Simply click to expand the view and start viewing.

 - The logging button is on top-right of the view.

 - Threads will be listed in expanded board lists.

 - Click thread titles to view thread contents at preview window.

 - Click '+' button of the board title to post new threads.

 - Click 'reply' button of threads to submit your reply.

 - Both new posts and replies can be edited in vscode's built-in editor. 
 Just create and save a file with a '.s1' ext name to be picked in the quickpick bar.

 - Click '->' or '<-' arrow key to turn pages when viewing threads in Markdown mode.

 - Disguise thread contents with Typescript/Python/Cpp coding style. (Other language styles are to be added.)
----

**Enjoy!**
