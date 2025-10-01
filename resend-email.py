import resend



resend.api_key = "re_6ykLHU1x_Actvq4xuvDubZLocJhG8deCL"

params: resend.Emails.SendParams = {
  "from": "Duncan Off-Campus <tickets@duncancompound.org>",
  "reply_to": "duncancompound@gmail.com",
  "to": ["wsully09@gmail.com"],
  "subject": f"Fall Formal Ticket #{ticket_number}",
  "html": f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fall Formal Ticket Confirmation</title>
    <style>
        body {{
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
            margin: 0;
            padding: 0;
        }}
        .email-container {{
            max-width: 400px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }}
        .header {{
            background: linear-gradient(135deg, #1a4f36 0%, #2c5530 100%);
            color: white;
            padding: 20px 15px;
            text-align: center;
        }}
        .header h1 {{
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }}
        .header p {{
            margin: 10px 0 0 0;
            font-size: 16px;
            opacity: 0.9;
        }}
        .content {{
            padding: 25px 20px;
        }}
        .ticket-info {{
            background-color: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }}
        .ticket-number {{
            font-size: 32px;
            font-weight: 700;
            color: #1a4f36;
            margin: 10px 0;
            letter-spacing: 2px;
        }}
        .ticket-label {{
            font-size: 14px;
            color: #6c757d;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
        }}
        .event-details {{
            background-color: #fff;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }}
        .event-details h3 {{
            color: #1a4f36;
            margin: 0 0 15px 0;
            font-size: 18px;
        }}
        .detail-row {{
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #f1f3f4;
        }}
        .detail-row:last-child {{
            border-bottom: none;
        }}
        .detail-label {{
            font-weight: 600;
            color: #495057;
        }}
        .detail-value {{
            color: #212529;
        }}
        .cta-button {{
            display: inline-block;
            background-color: #1a4f36;
            color: #ffffff !important;
            text-decoration: none !important;
            padding: 15px 30px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            margin: 25px 0;
            transition: background-color 0.3s ease;
        }}
        .cta-button:hover {{
            background-color: #2c5530;
        }}
        .footer {{
            background-color: #f8f9fa;
            padding: 15px 20px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }}
        .footer p {{
            margin: 5px 0;
            font-size: 14px;
            color: #6c757d;
        }}
        .important-note {{
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
        }}
        .important-note p {{
            margin: 0;
            color: #856404;
            font-size: 14px;
        }}
        @media (max-width: 600px) {{
            .email-container {{
                margin: 0;
                border-radius: 0;
            }}
            .content {{
                padding: 20px;
            }}
            .ticket-number {{
                font-size: 24px;
            }}
        }}
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Fall Formal Ticket Confirmed</h1>
            <p>Your ticket has been successfully purchased</p>
        </div>
        
        <div class="content">
            <div class="ticket-info">
                <div class="ticket-label">Ticket Number</div>
                <div class="ticket-number">#{ticket_number}</div>
            </div>
            
            
            <div style="text-align: center;">
                <a href="https://duncancompound.org/ticket/{ticket_number}" class="cta-button">View Your Ticket</a>
            </div>
            
            <p style="text-align: center; color: #6c757d; font-size: 14px; margin-top: 20px;">
                You can view your ticket anytime by clicking the button above or saving this link.
            </p>
        </div>
        
        <div class="footer">
            <p><strong>Duncan Off-Campus</strong></p>
            <p>825 East Washington Street</p>
            <p>Questions? Email duncancompound@gmail.com</p>
        </div>
    </div>
</body>
</html>
  """
}

email = resend.Emails.send(params)
print(email)


