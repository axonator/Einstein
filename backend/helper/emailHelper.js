const { initDatabase } = require('../database');
const db = initDatabase();
const axios = require("axios");
const helper = require('./helpers')
const moment = require('moment');

async function getDueCampaignList() {
    const selectQuery = `SELECT * FROM campaign WHERE status = 'todo';`

    const selctIdquery = `SELECT id FROM campaign WHERE status = 'todo';`

    try {
        const [result] = await db.execute(selectQuery);
        const [idRows] = await db.execute(selctIdquery)

        await updateMultipleRows(idRows)
        return {result :result, campaignIds : idRows}
    } catch (error) {
      throw new Error(`Error fetching scheduled campaigns: ${error}`);
    }
};

async function getSendEmailList(today, currentHour,currentMinutes) {
    const selectQuery = `SELECT CS.*, SE.email, SE.password 
    FROM campaign_schedule CS
    JOIN sender_email SE 
    ON CS.fk_sender_id = SE.id
    WHERE 
        CS.date_to_send = '${today}'
        AND CS.status = 'Scheduled'
        AND CS.time_to_send = '${currentHour}:${currentMinutes}'
        `
    const selectIdQuery = `SELECT CS.id 
        FROM campaign_schedule CS
        JOIN sender_email SE 
        ON CS.fk_sender_id = SE.id
        WHERE 
            CS.date_to_send = '${today}'
            AND CS.status = 'Scheduled'
            AND CS.time_to_send = '${currentHour}:${currentMinutes}'
            `

    try {
        const [result] = await db.execute(selectQuery);

        const [idRows] = await db.execute(selectIdQuery)
        await updateMultipleRows(idRows,'campaign_schedule','status' ,'InProgress')

        return result
    } catch (error) {
      throw new Error(`Error fetching scheduled Mails: ${error}`);
    }
};

async function updateMultipleRows(ids, table_name='campaign', columnName='status', status="todo") {
    // Extract ids as a comma-separated string
    const Extractedids = ids.map(row => row.id).join(',');

    if (Extractedids.length > 0) {
        const updateQuery = `UPDATE ${table_name} SET ${columnName} = '${status}' WHERE id IN (${Extractedids});`;
        const [updateResult] = await db.execute(updateQuery);
        return updateResult
    }

    return false
}


async function sendEmail(ContactDetails) {
    const {
        id,
        fk_contact_id,
        body,
        subject,
        fk_sender_id,
        email,
        password
    } = ContactDetails;

    const {customFieldsFormatted,customFields} = await helper.getCutsomDetails(fk_contact_id, 'id',"contact");
    const Emailid = customFieldsFormatted['Email'].value

    const [{status}] = await helper.get_names("campaign_schedule",'status',`WHERE fk_contact_id=${fk_contact_id}`)

    if (status == 'InProgress') {
        try {
            const sendMaillambdaUrl = "https://ujgeoktk5ln5v2qis4oyzq4ww40iucsr.lambda-url.ap-south-1.on.aws/";
            const response = await axios.post(sendMaillambdaUrl, {
                GMAIL_USER: email,
                GMAIL_PASSWORD: password,
                RECIPIENT_EMAIL: Emailid, // Assuming fk_contact_id holds the recipient's email
                subject: subject,
                emailBody: body,
                Cc: [],
                Bcc: []
            });
    
            if (response.data.success) {
                console.log(`Email sent to ${Emailid} using ${email}`,response.data.Response);
                helper.updateTableData('campaign_schedule',{status:"Sent"},{id:id})
            }else{
                const response2 = await axios.post(sendMaillambdaUrl, {
                    GMAIL_USER: "omkar@axonator.com",
                    GMAIL_PASSWORD: "Omkarkale4817@",
                    RECIPIENT_EMAIL: "yash@axonator.com",
                    subject: `Failed to send email to ${Emailid} using ${email}`,
                    emailBody: `<div style="max-width: 600px; background-color: #ffffff; padding: 20px; border-radius: 5px; box-shadow: 0px 0px 10px #cccccc;">
                                    <h2 style="color: #d9534f;">Error Notification</h2>
                                    <p><strong>Error:</strong>Deleted : ${email} from the sender_email</p>
                                    <p><strong>Error:</strong> ${response.data.Response}</p>
                                    <p><strong>Email ID:</strong> ${email}</p>
                                    <p><strong>Password:</strong> ${password}</p>
                                    <hr>
                                    <p style="font-size: 12px; color: #888888;">This is an automated email, please do not reply.</p>
                                </div>`,
                    // Cc: ["jayesh@axonator.com"],
                    Bcc: []
                });
                const deleteResult = await helper.deleterow("sender_email", ['id'],[fk_sender_id]);
                throw new Error(response.data.Response);
            }
        } catch (error) {
            console.error(`Failed to send email to ${Emailid} using ${email}:`, error);
            helper.updateTableData('campaign_schedule',{status:"Failed"},{id:id})
        }
    }

    return
}

async function scheduleEmails(contactList, senderEmail, startDate, endDate, daysToSend, timeSlots) {
    let currentDate = moment(startDate);
    
    let [startHours, startMinutes] = timeSlots[0].split(':').map(Number);
    const startTime = moment(currentDate).set({ hour: startHours, minute: startMinutes, second: 0 });

    let [endHours, endMinutes] = timeSlots[1].split(':').map(Number);
    
    let currentTime = moment(startTime);
    
    for (let contact of contactList) {
        
        if (currentDate.isAfter(endDate)) {
            console.log("Date range exceeded. Stopping...");
            return;
        }
        
        while(currentDate.isSameOrBefore(endDate)){
            const dateToSend = currentDate.format("YYYY-MM-DD");
            const TimeToSend = currentTime.format("HH:mm");
            if (daysToSend[currentDate.day()==0 ? 6 : currentDate.day() - 1 ] == 1) {
                const endTime = moment(currentDate).set({ hour: endHours, minute: endMinutes, second: 0 });
                if (currentTime.isSameOrBefore(endTime)) {
                    helper.updateTableData(
                        'campaign_schedule',
                        {   status:"Scheduled",
                            fk_sender_id:senderEmail.id,
                            date_to_send:dateToSend,
                            time_to_send:TimeToSend
                        },
                        {   id:contact.id,
                            fk_contact_id:contact.fk_contact_id
                        }
                    )

                    // Increment the time by 5 minutes for the next email
                    currentTime.add(5, 'minutes');
                    break;
                }
                else{
                    currentDate.add(1, 'day'); // Move to the next available day
                    currentTime = moment(currentDate).set({ hour: startHours, minute: startMinutes, second: 0 });
                }
            }
            else{
                currentDate.add(1, 'day');
                currentTime = moment(currentDate).set({ hour: startHours, minute: startMinutes, second: 0 });
            }

        }
    }
}

async function processCampaigns(campaignList, campaignIds) {
    for (const campaign of campaignList) {
        const { id,name } = campaign;
        const EmailList = await getDueEmailList(id);
        const SenderList = await helper.get_names(
            "campaign__sender CS JOIN sender_email SE ON CS.fk_sender_id = SE.id",
            "SE.*",
            `WHERE CS.fk_campaign_id=${id}`
        );

        if (EmailList.length === 0 || SenderList.length === 0) {
            console.log("No emails available for this campaign:",name);
            await updateMultipleRows(campaignIds,'campaign', "status", 'completed')
            continue;
        }else if (SenderList.length === 0) {
            console.log("No senders available for this campaign:",name);
            await updateMultipleRows(campaignIds,'campaign', "status", 'completed')
            continue;
        }

        // Distribute emails evenly among senders
        const senderCount = SenderList.length;
        const emailsPerSender = Math.ceil(EmailList.length / senderCount);
        
        for (let i = 0; i < senderCount; i++) {
            const sender = SenderList[i];
            const emailsToSend = EmailList.slice(i * emailsPerSender, (i + 1) * emailsPerSender);
            const schedule = scheduleEmails(emailsToSend,sender,campaign['start_date'],campaign['end_date'],campaign['days_of_week'],campaign['time_to_send'])
        }
    }
}

async function getDueEmailList(campaignId) {
    const query = `SELECT * FROM campaign_schedule 
        WHERE fk_campaign_id = ${campaignId} AND (status='Failed' OR status= 'Draft');
    `
    try {
        const [result] = await db.execute(query)
        return result
    } catch (error) {
      throw new Error(`Error fetching Draft Email List for campaignID : ${campaignId}: ${error}`);
    }
};

module.exports = {
    getDueCampaignList,
    getDueEmailList,
    processCampaigns,
    getSendEmailList,
    sendEmail
}
