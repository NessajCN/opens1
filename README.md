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
sudo apt install gnome-keyring
```
or Centos:
```
sudo yum install gnome-keyring-devel
```


## Extension Settings

Configurations have not been contributed. I'll add them soon.

## Known Issues

To be tested.

## Release Notes

First alpha version.

### 0.0.1

Initial alpha version.

### 0.0.2

Add logo.

### 0.0.3

Fix issues when posting.

### 0.0.4

Fix unicode display error.
Add menu button for turning thread page.

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

----

**Enjoy!**
