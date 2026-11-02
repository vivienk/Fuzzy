Source: https://docs.google.com/document/d/12gPP4mVYLw11Uf6eXVF3MDj5qTxOrRkBJ3WHt_EC2qA

Snapshot: November 1, 2026. Historical concept; see V2-DESIGN.md for actual current build scope.

# Fuzzy

Send your loved ones a 3D card

V1 Concept & Design | VibeLab Launchpad

Concept Lock • October 23, 2026

## The idea

Fuzzy turns personal greetings into AI-generated, interactive 3D worlds. Describe the occasion, the person, and the feeling you want to share; AI creates a small themed world that you can personalize, preview, and send. The recipient unwraps it, plays with it, and keeps a piece of it in their own world.

Messages don't disappear into a chat history. They become playful, persistent parts of a world you build together

Think Animal Crossing + Snapchat: the warmth, collecting, and personal spaces of a cozy world, paired with the ease and spontaneity of sending something to a friend. The long-term ambition is a world shaped by the messages and greetings people exchange.

## Problem & audience

The design hypothesis: digital greetings are easy to send but easy to lose in a stream of messages. A meaningful note can feel fleeting, and a flat card leaves little room for shared play or a lasting sense of presence.

Fuzzy is designed for friends, couples, and families who want a playful way to celebrate or say “thinking of you,” especially when they are apart. The first demo covers personal Halloween and Christmas greetings between two people. This audience and the emotional value of keeping a greeting still need user validation.

## Evolution & inspiration

The concept began as a 3D celebration-card direction and evolved into Fuzzy: AI-generated worlds where greetings become objects and moments in a personal space. Halloween and Christmas are the first two demo themes, demonstrating that the same creation experience adapts to different occasions. Birthdays, anniversaries, graduation, and everyday appreciation are future extensions.

Capy Post is an external inspiration and reference for this evolution. Fuzzy extends the idea toward varied characters, occasions, interactive scenes, and lasting keepsakes rather than focusing only on capybaras. This proposal does not claim ownership, authorship, affiliation, or permission to reuse Capy Post’s code or assets. Any reuse would require a separate license and attribution review.

Capy Post repository

Capy Post demo video

## AI-generated worlds • Create → Send → Unwrap → Play → Keep

The sender describes an occasion, recipient, and mood; AI generates a compact, interactive world around that intent. Both demo themes use the same journey. Halloween becomes a cozy-spooky pumpkin garden with a friendly ghost and hidden note. Christmas becomes a snowy cottage with a glowing tree and a wrapped present containing the greeting. The sender’s personal message remains the emotional centerpiece.

### Sender flow

- Create — Describe the occasion, recipient, and mood, then add your personal message. AI generates a themed 3D world with objects, layout, lighting, and a message-reveal interaction.

- Personalize and preview — Review the generated world, refine the prompt or regenerate it, and check the message and recipient’s reveal sequence before sharing.

- Send — Generate a link to the card and share it through an existing messaging channel. The prototype must clearly distinguish a working shared card from a simulated send.

### Recipient flow

- Unwrap — Open the link, see who the greeting is from, and activate the wrapped card or gate to reveal the scene and personal note.

- Play — In Halloween, light a pumpkin or trigger a friendly ghost. In Christmas, illuminate the tree or open a present to reveal the note. Optional candy or ornament interactions add a brief surprise; the personal message must remain easy to access.

- Keep — Place a small keepsake from the greeting in a personal nook, then reopen it to revisit the sender’s message. V1 design specifies this behavior; implementation and persistence are later proof points.

## Visual direction & storyboard

Use rounded, toy-like forms, soft materials, warm lighting, and expressive characters across both AI-generated themes. Halloween pairs pumpkin orange and warm cream with muted lavender and twilight. Christmas pairs snowy cream, pine green, warm gold, and soft red with glowing cottage windows. Keep the composition simple, the note legible, and the message more prominent than decoration.

The following storyboard describes the intended screens and scene states for both demo themes; it is design direction, not screenshots of a built product. Example Halloween prompt: “Make a cozy, spooky pumpkin garden for my best friend, with a friendly ghost hiding my message.” Example Christmas prompt: “Make a snowy Christmas cottage for my sister, with a glowing tree and a present she can open to read my note.”

### 01 / Make a little moment

A prompt field asks who the world is for, what the occasion is, and how it should feel. Generate creates the world preview. The sender can refine the prompt, regenerate, edit the personal note, and preview the reveal. Show a clear generation state, a retry option if generation fails, and preserve the sender’s message during revisions.

### 02 / Something arrived for you

A softly glowing parcel sits in a twilight pumpkin garden or a snowy cottage clearing, with the sender’s name and one clear Open action. Subtle motion suggests that it can be touched.

### 03 / A world unfolds

The parcel opens into the AI-generated world. In Halloween, a pumpkin glows and a friendly ghost appears. In Christmas, the tree lights up and a present opens. The personal note appears at a comfortable reading position, and the recipient can replay the reveal.

### 04 / Keep the feeling

A pumpkin or Christmas ornament becomes a keepsake in a cozy personal nook. Selecting it brings back the greeting and its sender. A growing collection is part of the longer-term vision; the demo illustrates the same keep interaction for both themes.

## Why spatial matters

The greeting becomes something a recipient opens, approaches, touches, and places. Depth and position give the note a setting; an object’s response creates a moment of surprise; a keepsake gives the message a place to return to.

- Unwrap: activate a parcel or gate and reveal the scene through a short, readable animation.

- Play: select a pumpkin or ghost in Halloween, or light a tree and open a present in Christmas. Use immediate visual feedback and optional candy or ornament interactions.

- Keep: select and place a keepsake in a constrained nook, then reopen its message.

- Comfort: start with a stationary, reachable scene and avoid forced camera movement. Support readable text, clear focus states, optional audio, and reduced-motion alternatives.

For the browser prototype, map interactions to pointer or touch input. Headset selection, grabbing, placement, controller or hand input, and their comfort constraints must be validated on the chosen SDK and target device.

## V1 scope & design deliverables

V1 is the Concept Lock submission: this document defines AI-generated worlds as the core experience, with Halloween and Christmas storyboards, prompt examples, generation behavior, spatial interactions, and a delivery plan. It does not claim a completed AI system, prototype, or APK.

- In scope: prompt-to-world creation for Halloween and Christmas, one shared sender-to-recipient journey, a personalized text note, preview and regeneration, a reveal, two or three playful interactions per theme, and a keepsake concept.

- Design deliverables: AI-generation concept, audience hypothesis, prompt examples for both themes, sender and recipient flows, four-state storyboard, generation/loading/retry states, spatial interaction descriptions, scope boundaries, and platform decision questions.

- Deferred: a full manual world editor, live multiplayer, public discovery, marketplaces, extensive character customization, voice/photo uploads, and a complete multi-occasion library. Generating every 3D mesh or texture from scratch is a later exploration; AI generation of the world itself is core scope.

A later prototype should test whether someone can turn a prompt into an appropriate world, refine it without losing their note, send and open the greeting without explanation, understand the interactive objects, and retrieve a kept message. Compare Halloween and Christmas results for relevance, variety, and reliability. These are proposed validation questions, not measured results.

## Platform plan & confirmation needed

Preferred prototype approach: Three.js with React Three Fiber for the interactive 3D scene, with WebXR explored for headset interaction. Proposed first AI implementation: interpret the sender’s prompt into a structured scene description, then compose objects, layout, lighting, and supported interactions from a curated 3D asset library. This makes the world AI-generated without requiring every asset to be generated from scratch. Validate scene output before rendering and preserve the sender’s exact note. Model/provider choice and generation performance remain to be evaluated; this is not a verified implementation or approved VibeLab platform.

The supplied Launchpad brief asks participants to choose Unity SDK or Spatial SDK. Compatibility between the preferred web stack and the program’s Spatial SDK is unconfirmed. WebXR must not be treated as equivalent to Spatial SDK, and a browser experience must not be presented as a qualifying APK.

- Confirm with DevRel whether a WebXR/Three.js/React Three Fiber prototype is acceptable for V1 concept review.

- Confirm the exact Spatial SDK, supported runtime, target headset, input requirements, and whether the proposed web approach can satisfy the mandatory V2–V4 APK deliverables.

- If the web approach is not supported, select Unity SDK or a confirmed Spatial SDK implementation path before V2; carry over the experience design and reusable assets where permitted.

Decision status: preferred web prototype and AI scene-composition approach identified; model/provider selection, program SDK compatibility, and APK delivery route pending confirmation. The demo must distinguish AI-generated scene decisions, curated assets, and any pre-authored or simulated behavior.

## V1–V4 • AI world generation roadmap

V1 / AI concept and design: define prompt inputs and generation behavior; storyboard Halloween and Christmas; specify preview, refinement, reveal, play, and keep; confirm the SDK and APK delivery route. Deliverable: this concept/design document, with an APK optional. V2–V4 require APKs under the supplied brief. The following feature allocation is proposed, with no claim that builds already exist.

### V2 / Generate and play

After SDK confirmation, deliver an installable APK demonstrating prompt-to-world generation for both Halloween and Christmas through the same creation flow. Use AI scene composition with curated assets as the proposed starting point. Include a personal note, preview, unwrap animation, and basic object interactions. Validate installation, input, readability, comfort, and performance on the target headset. Completion check: a prompt produces a theme-appropriate playable world with a readable greeting. Clearly identify what AI generates and label any mocked sending or storage.

### V3 / Personalize, send, and keep

Deliver an updated APK with prompt refinement or regeneration, sender-to-recipient delivery, and saved worlds and keepsakes. Preserve the personal note across revisions and handle generation, delivery, or save failures. Verify that the intended recipient can open the card and retrieve the same saved world and message after a restart. Test both themes with senders and recipients, and refine the experience using feedback.

### V4 / Refine generation and demonstrate

Deliver a polished APK with the complete create/send/unwrap/play/keep journey across Halloween and Christmas. Improve generation consistency, loading time, scene quality, headset performance, interaction feedback, accessibility, and comfort. Completion check: both themes work reliably from prompt to saved keepsake. Prepare a concise demo video showing generation and the recipient experience, and optionally a private source repository for headset-specific debugging. Additional occasions follow once the core experience is validated.

## Reference links

- Capy Post: https://github.com/chinesepowered/hack-tripothon
- Reference demo: https://github.com/chinesepowered/hack-tripothon/blob/main/submission/capy-post-demo-day.mp4
- PICO samples: https://github.com/Pico-Developer/PICO-Spatial-SDK-Samples

