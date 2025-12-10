document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);

        // Participants section (bulleted list)
        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsTitle = document.createElement("h5");
        participantsTitle.textContent = "Participants";
        participantsSection.appendChild(participantsTitle);

        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";

        if (Array.isArray(details.participants) && details.participants.length > 0) {
          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            // participant email text
            const span = document.createElement("span");
            span.className = "participant-email";
            span.textContent = p;

            // remove button
            const btn = document.createElement("button");
            btn.className = "participant-remove";
            btn.type = "button";
            btn.title = `Remove ${p}`;
            btn.innerHTML = "✖";

            // Assemble li
            li.appendChild(span);
            li.appendChild(btn);
            participantsList.appendChild(li);

            // Remove handler
            btn.addEventListener("click", async () => {
              if (!confirm(`Remove ${p} from ${name}?`)) return;
              btn.disabled = true;
              try {
                const res = await fetch(
                  `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(p)}`,
                  { method: "DELETE" }
                );
                const data = await res.json();
                if (res.ok) {
                  // remove list item
                  li.remove();

                  // update availability display (increase by 1)
                  const availEl = activityCard.querySelector('.availability');
                  if (availEl) {
                    const m = availEl.textContent.match(/(\d+)/);
                    if (m) {
                      const cur = parseInt(m[1], 10);
                      availEl.textContent = `Availability: ${cur + 1} spots left`;
                    }
                  }

                  // if no participants left, show info
                  if (participantsList.children.length === 0) {
                    const info = document.createElement('p');
                    info.className = 'info';
                    info.textContent = 'No participants yet.';
                    participantsSection.appendChild(info);
                  }
                } else {
                  alert(data.detail || 'Failed to remove participant');
                  btn.disabled = false;
                }
              } catch (err) {
                console.error('Error removing participant:', err);
                alert('Failed to remove participant');
                btn.disabled = false;
              }
            });
          });
        } else {
          const empty = document.createElement("p");
          empty.className = "info";
          empty.textContent = "No participants yet.";
          participantsSection.appendChild(empty);
        }

        participantsSection.appendChild(participantsList);
        activityCard.appendChild(participantsSection);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
