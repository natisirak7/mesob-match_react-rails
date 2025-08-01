module RequestSpecHelper
  def json_response
    JSON.parse(response.body)
  end

  def auth_headers(user)
    token = JwtService.encode(user_id: user.id)
    { 'Authorization' => "Bearer #{token}" }
  end

  def json_headers
    { 'Content-Type' => 'application/json' }
  end

  def auth_json_headers(user)
    auth_headers(user).merge(json_headers)
  end
end
