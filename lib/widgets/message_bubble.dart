import 'package:flutter/material.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../constants.dart';
import '../models/message_model.dart';

/// A message bubble widget for displaying chat messages
class MessageBubble extends StatelessWidget {
  final MessageModel message;
  final bool isMe;
  final String senderUsername;

  const MessageBubble({
    super.key,
    required this.message,
    required this.isMe,
    required this.senderUsername,
  });

  @override
  Widget build(BuildContext context) {
    // Define the light green gradient for sender bubbles
    final senderGradient = const LinearGradient(
      colors: [Color(0xFFB5EAD7), Color(0xFF8FD5A6)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    );
    
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
      child: Column(
        crossAxisAlignment: isMe
            ? CrossAxisAlignment.end
            : CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 4, right: 4, bottom: 2),
            child: Text(
              isMe ? 'You' : senderUsername,
              style: const TextStyle(
                fontSize: 12, 
                color: Color(0xFF999999), // Subtle gray for timestamps
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              gradient: isMe ? senderGradient : null,
              color: isMe ? null : Colors.white,
              borderRadius: BorderRadius.circular(16), // Consistent 16px rounded corners
              boxShadow: [
                BoxShadow(
                  color: (isMe ? AppConstants.primaryColor : AppConstants.accentColor).withOpacity(0.1),
                  spreadRadius: 0,
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  message.message,
                  style: TextStyle(
                    color: AppConstants.darkColor, // Black text for both sender and receiver
                    fontSize: 16,
                    fontWeight: FontWeight.w400, // Regular weight for message text
                    height: 1.4, // Slightly increased line height for readability
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  timeago.format(message.timestamp),
                  style: TextStyle(
                    color: const Color(0xFF666666), // Darker gray for timestamps
                    fontSize: 12,
                    fontWeight: FontWeight.w400,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
