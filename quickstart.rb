require 'google/apis/gmail_v1'
require 'googleauth'
require 'googleauth/stores/file_token_store'
require 'pry'

require 'fileutils'

OOB_URI = 'urn:ietf:wg:oauth:2.0:oob'
APPLICATION_NAME = 'Gmail API Ruby Quickstart'
CLIENT_SECRETS_PATH = 'client_id.json'
CREDENTIALS_PATH = File.join(Dir.home, '.credentials',
                             "gmail-ruby-quickstart.yaml")
SCOPE = Google::Apis::GmailV1::AUTH_GMAIL_READONLY

##
# Ensure valid credentials, either by restoring from the saved credentials
# files or intitiating an OAuth2 authorization. If authorization is required,
# the user's default browser will be launched to approve the request.
#
# @return [Google::Auth::UserRefreshCredentials] OAuth2 credentials
def authorize
  FileUtils.mkdir_p(File.dirname(CREDENTIALS_PATH))

  client_id = Google::Auth::ClientId.from_file(CLIENT_SECRETS_PATH)
  token_store = Google::Auth::Stores::FileTokenStore.new(file: CREDENTIALS_PATH)
  authorizer = Google::Auth::UserAuthorizer.new(
    client_id, SCOPE, token_store)
  user_id = 'default'
  credentials = authorizer.get_credentials(user_id)
  if credentials.nil?
    url = authorizer.get_authorization_url(
      base_url: OOB_URI)
    puts "Open the following URL in the browser and enter the " +
         "resulting code after authorization"
    puts url
    code = gets
    credentials = authorizer.get_and_store_credentials_from_code(
      user_id: user_id, code: code, base_url: OOB_URI)
  end
  credentials
end

# Initialize the API
service = Google::Apis::GmailV1::GmailService.new
service.client_options.application_name = APPLICATION_NAME
service.authorization = authorize

# Show the user's labels
user_id = 'me'
# result = service.list_user_labels(user_id)

# puts "Labels:"
# puts "No labels found" if result.labels.empty?
# result.labels.each { |label| puts "- #{label.name}" }

class MessagePresenter < SimpleDelegator # DelegateClass(Google::Apis::GmailV1::Message)
  def subject
    headers["subject"]
  end

  private

  def headers
    @headers ||= Hash.new do |hash, key|
      value = payload.headers.find { |h| h.name.downcase == key }.value
      hash[key] = value
    end
  end
end

result = service.list_user_threads(user_id, label_ids: ["INBOX"])

subjects = result.threads.flat_map do |thread|
  thread = service.get_user_thread(user_id, thread.id)
  thread.messages.map { |m| MessagePresenter.new(m) }.map(&:subject)
end

puts subjects
