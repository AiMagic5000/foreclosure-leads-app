export interface ScriptedMessage {
  trigger_second: number
  sender_name: string
  sender_type?: string
  message: string
}

export const SCRIPTED_MESSAGES: ScriptedMessage[] = [
  // 0:00-1:00 - Early arrivals + Allie welcome
  { trigger_second: 5, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Hey everyone! I\'m Allie, Corey\'s moderator. Welcome to the live webcast! Corey is about to break down how surplus fund recovery works and show you real deals. If you have any questions, drop them right here in the chat and I\'ll get to them as he presents.' },
  { trigger_second: 12, sender_name: 'Marcus T.', message: 'Just joined! Super excited about this' },
  { trigger_second: 22, sender_name: 'Sandra R.', message: 'Hey everyone! First time here' },
  { trigger_second: 35, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Welcome Marcus, Sandra! Glad you made it. Pay close attention to the deal examples Corey is about to walk through.' },
  { trigger_second: 45, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Quick tip for everyone -- if you speak Spanish, there is an English/Spanish translation toggle on the top left of usforeclosurerecovery.com. Share the link with anyone who might benefit!' },
  { trigger_second: 55, sender_name: 'Derek P.', message: 'I lost my job 3 months ago. Came at the right time honestly' },
  { trigger_second: 65, sender_name: 'Lisa Nguyen', message: 'Heard about this from a friend, she said I had to watch' },
  // 1:00-2:00
  { trigger_second: 75, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Derek -- a lot of people in your position have started here and done really well. Stick around for the partnership details at the end.' },
  { trigger_second: 90, sender_name: 'Tony M.', message: 'Is this really real? Like people are actually making money doing this?' },
  { trigger_second: 105, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Tony -- 100%. The money comes from state-held surplus funds. It is public record. Corey is about to show you exactly how it works.' },
  { trigger_second: 115, sender_name: 'Brittany K.', message: 'How many people are watching right now?' },
  { trigger_second: 125, sender_name: 'James Okafor', message: 'Just texted my wife, she needs to see this too' },
  // 2:00-3:00
  { trigger_second: 140, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'James -- smart move! A lot of couples do this together. One handles outreach, the other handles paperwork.' },
  { trigger_second: 150, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'For everyone just tuning in -- I\'m Allie, your moderator for today\'s webcast. Corey Pearson is presenting live. Drop your questions in the chat and I\'ll answer them as we go!' },
  { trigger_second: 165, sender_name: 'Rachel D.', message: 'Where does the money actually come from?' },
  { trigger_second: 180, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Rachel -- when a foreclosed home sells for MORE than what is owed, the extra money (the surplus) goes to the state. The former homeowner is entitled to it but most never claim it. That is where we come in.' },
  { trigger_second: 195, sender_name: 'Nicole W.', message: 'Can you do this from anywhere? I am in Florida' },
  // 3:00-4:00
  { trigger_second: 210, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Nicole -- yes you can work from anywhere. We operate across all 50 states. Your location does not limit which states you can recover funds from.' },
  { trigger_second: 225, sender_name: 'Mike S.', message: 'This is crazy. I had no idea surplus funds were even a thing' },
  { trigger_second: 240, sender_name: 'Tasha L.', message: 'How much can you realistically make per deal?' },
  { trigger_second: 255, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Tasha -- deals typically run $3K-$47K+ depending on the surplus amount. The state sets the numbers, not us. Corey just covered a $47,400 example.' },
  { trigger_second: 270, sender_name: 'Daniel K.', message: 'How did I not know about this before' },
  // 4:00-5:00
  { trigger_second: 285, sender_name: 'Brandon Y.', message: 'Do you need a license for this??' },
  { trigger_second: 300, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Brandon -- no license needed in most states. We cover all the compliance details in the training.' },
  { trigger_second: 310, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Reminder -- your free preview account was created when you signed up. Log into usforeclosureleads.com to explore the dashboard while Corey walks you through everything.' },
  { trigger_second: 320, sender_name: 'Amanda C.', message: 'What is the catch? This sounds too good' },
  { trigger_second: 335, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Amanda -- totally fair to be skeptical. The catch is it takes real work. You have to find the homeowners, contact them, and walk them through the process. But the system handles most of that for you.' },
  // 5:00-6:00
  { trigger_second: 350, sender_name: 'David W.', message: 'Wait so the homeowners just LEAVE the money??' },
  { trigger_second: 365, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'David -- most of them do not even know it exists. They lost their home and moved on. Nobody tells them there is money waiting for them.' },
  { trigger_second: 380, sender_name: 'Crystal M.', message: 'How long does a typical deal take from start to finish?' },
  { trigger_second: 395, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Crystal -- anywhere from 2 weeks to 60 days depending on the state. Some states are faster than others. The system tracks every step.' },
  { trigger_second: 405, sender_name: 'Rebecca A.', message: 'The dashboard Corey is showing looks really professional' },
  // 6:00-7:00
  { trigger_second: 420, sender_name: 'Priya V.', message: 'Is this available in all states or just certain ones?' },
  { trigger_second: 435, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Priya -- we have active leads across all 50 states. Some states are easier to work than others and we help you focus on the best ones.' },
  { trigger_second: 445, sender_name: 'Jason K.', message: 'What if the homeowner already claimed the money?' },
  { trigger_second: 460, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Jason -- the system filters those out. We only show you unclaimed surplus funds. If it is in the dashboard, it is available.' },
  { trigger_second: 475, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Great question Jason. And just so everyone knows -- Corey is about to show you how the skip tracing and outreach automation works. This is the part that blows most people\'s minds.' },
  // 7:00-8:00
  { trigger_second: 490, sender_name: 'Maria G.', message: 'I am a stay at home mom, can I really do this?' },
  { trigger_second: 505, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Maria -- absolutely. We have several parents who do this during nap time and after bedtime. The outreach system runs automatically once you set it up.' },
  { trigger_second: 515, sender_name: 'Robert J.', message: 'How do you get paid? Wire transfer?' },
  { trigger_second: 530, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Robert -- the state sends the check directly. Your fee comes from the recovery. Wire or check, depends on the state.' },
  { trigger_second: 540, sender_name: 'Yolanda P.', message: 'My sister does real estate and she never mentioned this' },
  // 8:00-9:00
  { trigger_second: 555, sender_name: 'Keisha B.', message: 'What is the 67-Point framework he keeps mentioning?' },
  { trigger_second: 570, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Keisha -- it is Corey\'s proprietary system for qualifying leads. 67 data points that tell you if a deal is worth pursuing before you spend any time on it. Partners get full access.' },
  { trigger_second: 585, sender_name: 'Travis N.', message: 'I have been looking for something like this for months' },
  { trigger_second: 595, sender_name: 'Ana P.', message: 'Same! I keep seeing ads for drop shipping and crypto but this actually seems real' },
  // 9:00-10:00
  { trigger_second: 610, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Ana -- because it IS real. The money is sitting in state accounts right now. It is public record. Nobody is making anything up here.' },
  { trigger_second: 625, sender_name: 'Carlos M.', message: 'The part about the 67-Point framework makes sense, its systematic' },
  { trigger_second: 640, sender_name: 'Denise R.', message: 'How much does it cost to get started?' },
  { trigger_second: 655, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Denise -- there is zero upfront cost to the homeowner. Our fee comes from the recovery itself. For the partnership program, Corey is going to cover all the details toward the end.' },
  { trigger_second: 665, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Also Denise -- your free preview account is already set up from when you registered. Go explore it at usforeclosureleads.com while you watch!' },
  // 10:00-11:00
  { trigger_second: 680, sender_name: 'William A.', message: 'Is this legal? Not trying to get in trouble' },
  { trigger_second: 695, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'William -- completely legal. This is a regulated industry with state-specific guidelines. We operate within all of them. The training covers every compliance requirement.' },
  { trigger_second: 710, sender_name: 'Tamara J.', message: 'Can you do this part time while working a regular job?' },
  { trigger_second: 725, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Tamara -- yes, a lot of people start part time. The outreach automation runs 24/7 once you set it up. You just check in and work the responses.' },
  { trigger_second: 735, sender_name: 'Frank B.', message: 'My buddy made 12k last month doing this. Thought he was joking' },
  // 11:00-12:00
  { trigger_second: 750, sender_name: 'Steven H.', message: '47k in one deal??? I need to start TODAY' },
  { trigger_second: 765, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Steven -- that is one of the bigger ones. Average deals are $8K-$15K but the larger surplus amounts definitely happen. Stick around for the partnership offer.' },
  { trigger_second: 780, sender_name: 'Kim P.', message: 'How do you find the homeowners after they move?' },
  { trigger_second: 795, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Kim -- we use skip tracing technology. It finds their current address, phone number, and email. The system does it automatically for every lead in your dashboard.' },
  // 12:00-13:00
  { trigger_second: 810, sender_name: 'Anthony F.', message: 'What happens if the homeowner does not respond?' },
  { trigger_second: 825, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Anthony -- the automated follow-up sequence handles that. Email, text, even voicemail drops. Most people respond after the second or third touch.' },
  { trigger_second: 840, sender_name: 'Jasmine T.', message: 'I work in real estate already, would this be a conflict?' },
  { trigger_second: 855, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Jasmine -- not at all! Several of our top performers came from real estate. Your existing skills actually give you an advantage.' },
  { trigger_second: 865, sender_name: 'Victor L.', message: 'Is Corey showing the actual platform right now? This is impressive' },
  // 13:00-14:00
  { trigger_second: 880, sender_name: 'Greg L.', message: 'How many leads do you get per month?' },
  { trigger_second: 895, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Greg -- we pull new leads daily across all active states. Partners get leads assigned directly to their account. The volume depends on your plan.' },
  { trigger_second: 910, sender_name: 'Vanessa M.', message: 'This presentation is so much better than I expected' },
  { trigger_second: 925, sender_name: 'Darnell W.', message: 'Facts. Most webinars are fluff, this is actual process' },
  { trigger_second: 935, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Vanessa, Darnell -- appreciate that! Corey does not do fluff. Real deals, real numbers, real process. That is the whole point.' },
  // 14:00-15:00
  { trigger_second: 955, sender_name: 'Heather S.', message: 'What is the success rate for new partners?' },
  { trigger_second: 970, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Heather -- partners who follow the system and work the leads consistently close their first deal within 30-60 days on average.' },
  { trigger_second: 985, sender_name: 'Ray C.', message: 'Can you do this if you have bad credit?' },
  { trigger_second: 1000, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Ray -- your credit has zero impact on this. You are helping homeowners recover their money, not borrowing or lending. Credit score is irrelevant.' },
  { trigger_second: 1010, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Great question Ray. I get that one a lot. This is about asset recovery, not credit or financing. Completely different world.' },
  // 15:00-16:00
  { trigger_second: 1030, sender_name: 'Monica J.', message: 'Do we have to talk to homeowners on the phone?' },
  { trigger_second: 1045, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Monica -- most of the initial outreach is automated. Emails, texts, and voicemail drops go out automatically. You only talk to people who respond and are interested.' },
  { trigger_second: 1060, sender_name: 'Chris D.', message: 'Just signed up for my preview account! The dashboard looks clean' },
  { trigger_second: 1075, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Chris -- nice! Explore the dashboard and check out how the system works. When you are ready for live leads, the partnership is the way in.' },
  { trigger_second: 1085, sender_name: 'Stephanie W.', message: 'How is this different from those real estate guru courses?' },
  { trigger_second: 1095, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Stephanie -- huge difference. Those sell you a course and wish you luck. We give you the actual leads, the automation system, and Corey working alongside you. Night and day.' },
  // 16:00-17:00 (approaching partnership offer)
  { trigger_second: 1110, sender_name: 'Angela B.', message: 'The 50/50 split deal sounds unreal -- is that still on the table?' },
  { trigger_second: 1125, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Angela -- yes the 50/50 split is real. Corey is doing a very limited number of those and the details drop in the last few minutes. Do not leave early.' },
  { trigger_second: 1140, sender_name: 'Kevin H.', message: 'I work in real estate and even I did not know you could do this independently' },
  { trigger_second: 1155, sender_name: 'Natasha R.', message: 'How is this different from other surplus funds programs?' },
  { trigger_second: 1170, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Natasha -- most programs sell you a course and leave you to figure it out. We give you the leads, the system, AND the training. Partners get leads assigned directly to their account with full outreach automation pre-configured.' },
  { trigger_second: 1185, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'We are getting close to the partnership details everyone. Corey is about to open up applications. If you have been on the fence, now is the time to pay attention.' },
  // 17:00-18:00 (right before partnership banner)
  { trigger_second: 1200, sender_name: 'Ryan T.', message: 'Just got my preview account email. This is legit.' },
  { trigger_second: 1215, sender_name: 'Sofia L.', message: 'Corey are you still doing the partnership thing? I am ready' },
  { trigger_second: 1230, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Sofia -- yes! The partnership application is about to open. Only 3-5 new partners per week so apply as soon as the link goes live.' },
  { trigger_second: 1245, sender_name: 'Paul M.', message: 'How fast can you start after applying?' },
  { trigger_second: 1260, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Paul -- once approved, leads get assigned to your account within 24 hours. You could be reaching out to homeowners by tomorrow.' },
  { trigger_second: 1275, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'The partnership application just opened at the top of the page! Click "APPLY FOR PARTNERSHIP" to get started. Remember -- only 3-5 spots per week.' },
  // 18:00-20:00 (partnership banner is live, urgency picks up)
  { trigger_second: 1295, sender_name: 'Brittany K.', message: 'Just applied for the partnership!!' },
  { trigger_second: 1310, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Brittany -- awesome! Corey reviews applications tonight. You are going to love having leads assigned directly.' },
  { trigger_second: 1330, sender_name: 'Marcus T.', message: 'Applied too. This is the real deal' },
  { trigger_second: 1345, sender_name: 'Terrence B.', message: 'If I apply now when would I hear back?' },
  { trigger_second: 1360, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Terrence -- Corey personally reviews every application. Most people hear back within 24 hours. He only takes 3-5 per week so apply while spots are open.' },
  { trigger_second: 1380, sender_name: 'Jessica L.', message: 'Can I do this alongside my nursing job?' },
  { trigger_second: 1395, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Jessica -- several of our partners work full-time in healthcare. The automation handles outreach while you are at work. You just check your dashboard on breaks.' },
  { trigger_second: 1410, sender_name: 'Shawn T.', message: 'My wife just walked in, she wants to know what I am so excited about' },
  { trigger_second: 1420, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Shawn -- tell her to pull up usforeclosurerecovery.com and watch together! Spanish/English toggle is on the top left if she prefers Spanish.' },
  // 20:00-22:00
  { trigger_second: 1440, sender_name: 'Omar S.', message: 'What is the partnership fee?' },
  { trigger_second: 1455, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Omar -- Corey covers the full details on the application page. It is a partnership, not a course -- you get leads, automation, training, and Corey in your corner.' },
  { trigger_second: 1475, sender_name: 'Linda H.', message: 'I have been scammed before by programs like this. What makes this different?' },
  { trigger_second: 1495, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Linda -- totally understand. The difference is we do not sell you a course and disappear. Partners get live leads assigned to their account, a fully configured outreach system, and direct access to Corey. You are not alone in this.' },
  { trigger_second: 1515, sender_name: 'Derek P.', message: 'Just applied. Honestly nervous but excited' },
  { trigger_second: 1530, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Derek -- I remember you said you lost your job 3 months ago. This could be the start of something big. Corey will take care of you.' },
  { trigger_second: 1545, sender_name: 'Tiffany R.', message: 'How many people applied today?' },
  { trigger_second: 1555, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Tiffany -- I have seen a bunch come in just from this session. That is why the spots fill up fast. If you are thinking about it, do not wait.' },
  // 22:00-24:00
  { trigger_second: 1575, sender_name: 'Carla F.', message: 'How many deals do most partners close per month?' },
  { trigger_second: 1590, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Carla -- it varies. New partners typically close 1-2 in their first month. Experienced partners doing it full time close 4-6. The leads volume is there, it comes down to follow-through.' },
  { trigger_second: 1610, sender_name: 'Andre W.', message: 'This might be the best webcast I have ever attended' },
  { trigger_second: 1625, sender_name: 'Michelle T.', message: 'Agreed! No fluff, just real information' },
  { trigger_second: 1640, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Andre, Michelle -- we appreciate that! If you got value, definitely apply for the partnership while spots are still open today.' },
  // 24:00-26:00 (winding down, final push)
  { trigger_second: 1660, sender_name: 'Diana R.', message: 'My husband and I just applied together!' },
  { trigger_second: 1675, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Diana -- love it! Couples who work this together are some of our most successful partners. Two people covering more ground.' },
  { trigger_second: 1695, sender_name: 'Sam W.', message: 'Can you apply if you are in Canada?' },
  { trigger_second: 1710, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Sam -- the leads are US-based but you can work them from anywhere with an internet connection. We have partners in several countries.' },
  { trigger_second: 1730, sender_name: 'Tony M.', message: 'Just submitted my application. Lets go!' },
  { trigger_second: 1745, sender_name: 'Lisa Nguyen', message: 'Same! My friend was right, this is the real deal' },
  // 26:00-27:00 (final messages)
  { trigger_second: 1760, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'For everyone who applied -- Corey reviews apps tonight. Check your email tomorrow. For everyone still on the fence, your preview account is active so explore the dashboard. We will be here when you are ready.' },
  { trigger_second: 1780, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Last reminder -- usforeclosurerecovery.com has all the details about the program. Spanish translation is available on the site. Text or call (888) 545-8007 if you have questions after the webcast.' },
  { trigger_second: 1800, sender_name: 'Sandra R.', message: 'Thank you Allie and Corey! This was amazing' },
  { trigger_second: 1815, sender_name: 'Monique F.', message: '27 minutes went by SO fast. Incredible info' },
  { trigger_second: 1835, sender_name: 'Allie', sender_type: 'moderator_ai', message: 'Thank you everyone for spending time with us today! If you have not applied yet, the partnership link is still active. Questions? Reply here or text (888) 545-8007. Talk soon!' },
]

// Calculate session offset from wall clock -- sessions start at :00 and :30 every hour
export function getSessionOffset(): number {
  const now = new Date()
  const min = now.getMinutes()
  const sec = now.getSeconds()
  const slotStart = min >= 30 ? 30 : 0
  return (min - slotStart) * 60 + sec
}
