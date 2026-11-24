// Metro (Expo SDK 57): bỏ qua thư mục web/ — trang quản trị Next.js có node_modules (React) riêng, không thuộc app.
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const webDir = new RegExp(`^${path.resolve(__dirname, "web").replace(/[/\\]/g, "[/\\\\]")}[/\\\\].*`);
const existing = config.resolver.blockList;
config.resolver.blockList = [...(Array.isArray(existing) ? existing : existing ? [existing] : []), webDir];

module.exports = config;
