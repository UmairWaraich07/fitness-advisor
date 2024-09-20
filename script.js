import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

document.addEventListener("DOMContentLoaded", () => {
  const screen1 = document.getElementById("screen1");
  const screen2 = document.getElementById("screen2");
  const screen3 = document.getElementById("screen3");
  const screen4 = document.getElementById("screen4");
  const startButtons = document.querySelectorAll(".start-button");
  const quizCard = document.querySelector(".quiz-card");
  const progressBar = document.querySelector(".progress");
  const questionElement = document.querySelector(".question h2");
  const subtitleElement = document.querySelector(".subtitle");
  const answerOptions = document.querySelectorAll(".answer-option");
  const prevButton = document.querySelector(".nav-button.prev");
  const nextButton = document.querySelector(".nav-button.next");
  const questionCountElement = document.querySelector(".question-count");
  const presentationBtn = document.getElementById("presentationBtn");

  let currentQuestion = 0;
  let gender = "";
  let userAnswers = [];

  const womenQuestions = [
    {
      question: "What's your primary fitness goal?",
      subtitle: "(Choose the option that best describes your main objective)",
      answers: [
        "Weight Loss",
        "Muscle Toning",
        "Overall Health",
        "Strength Gain",
      ],
    },
    {
      question: "How many days per week can you commit to working out?",
      subtitle: "(Be realistic about your schedule and commitments)",
      answers: ["1-2 days", "3-4 days", "5-6 days", "Every day"],
    },
    {
      question: "Do you have any experience with strength training?",
      subtitle: "(This helps us tailor the difficulty of your workouts)",
      answers: ["None", "Beginner", "Intermediate", "Advanced"],
    },
    {
      question: "Are you currently following any specific diet?",
      subtitle:
        "(Your nutrition plays a crucial role in achieving your fitness goals)",
      answers: [
        "No specific diet",
        "Low-carb",
        "Vegetarian/Vegan",
        "Intermittent Fasting",
      ],
    },
    {
      question: "Do you have any physical limitations or health concerns?",
      subtitle:
        "(This information helps us create a safe workout plan for you)",
      answers: [
        "None",
        "Joint Issues",
        "Back Problems",
        "Cardiovascular Concerns",
      ],
    },
  ];

  const menQuestions = [
    {
      question: "What's your primary fitness goal?",
      subtitle: "(Choose the option that best aligns with your main objective)",
      answers: [
        "Build Muscle",
        "Lose Fat",
        "Increase Strength",
        "Improve Overall Fitness",
      ],
    },
    {
      question: "How many days per week can you dedicate to working out?",
      subtitle: "(Consider your current schedule and commitments)",
      answers: ["1-2 days", "3-4 days", "5-6 days", "Every day"],
    },
    {
      question: "What's your experience level with weightlifting?",
      subtitle:
        "(This helps us determine the appropriate intensity for your workouts)",
      answers: ["Beginner", "Intermediate", "Advanced", "Professional"],
    },
    {
      question: "Are you currently following any specific diet plan?",
      subtitle: "(Your nutrition is crucial for achieving your fitness goals)",
      answers: [
        "No specific diet",
        "High-protein",
        "Keto",
        "Intermittent Fasting",
      ],
    },
    {
      question:
        "Do you have any injuries or health concerns we should be aware of?",
      subtitle:
        "(This information ensures we create a safe and effective plan for you)",
      answers: [
        "None",
        "Joint Issues",
        "Back Problems",
        "Cardiovascular Concerns",
      ],
    },
  ];

  function switchScreen(fromScreenId, toScreenId) {
    const fromScreen = document.getElementById(fromScreenId);
    const toScreen = document.getElementById(toScreenId);

    // Add the exiting class for fade-out animation
    fromScreen.classList.add("exiting");

    // After the fade-out animation is done (200ms), hide the screen and show the new one
    setTimeout(() => {
      fromScreen.classList.remove("exiting");
      fromScreen.classList.add("hidden"); // Hide the screen by setting display: none

      // Prepare the new screen for fade-in
      toScreen.classList.remove("hidden");
      toScreen.classList.add("entering");

      // Trigger the fade-in effect by adding the active class
      setTimeout(() => {
        toScreen.classList.add("screen-active");
        toScreen.classList.remove("entering"); // Clean up the entering class
      }, 20); // Small delay to ensure class transition is applied
    }, 300); // Matches the fade-out duration (0.2s)
  }

  function startQuiz(selectedGender) {
    gender = selectedGender;
    userAnswers = [];
    currentQuestion = 0;

    switchScreen("screen1", "screen2");
    showQuestion(currentQuestion);
  }

  function showQuestion(index) {
    const questions = gender === "women" ? womenQuestions : menQuestions;
    const question = questions[index];
    questionElement.textContent = question.question;
    subtitleElement.textContent = question.subtitle;
    answerOptions.forEach((option, i) => {
      option.querySelector("input").checked = false;
      option.classList.remove("selected");
      option.querySelector("input").value = question.answers[i]
        .toLowerCase()
        .replace(/\s+/g, "-");
      option.querySelector("input").nextElementSibling.nextSibling.textContent =
        question.answers[i];
    });
    progressBar.style.width = `${((index + 1) / questions.length) * 100}%`;
    questionCountElement.textContent = `${index + 1}/${questions.length}`;
    prevButton.style.visibility = index === 0 ? "hidden" : "visible";
    nextButton.textContent = index === questions.length - 1 ? "Finish" : ">";

    // Restore previous answer if available
    if (userAnswers[index]) {
      const selectedOption = Array.from(answerOptions).find(
        (option) => option.querySelector("input").value === userAnswers[index]
      );
      if (selectedOption) {
        selectedOption.classList.add("selected");
        selectedOption.querySelector("input").checked = true;
      }
    }
  }

  function getSelectedAnswer() {
    const selectedOption = Array.from(answerOptions).find(
      (option) => option.querySelector("input").checked
    );
    return selectedOption ? selectedOption.querySelector("input").value : null;
  }

  function prepareDataForChatGPT() {
    const questions = gender === "women" ? womenQuestions : menQuestions;
    return {
      gender: gender,
      answers: questions.map((question, index) => ({
        question: question.question,
        answer: userAnswers[index] || "Not answered",
      })),
    };
  }

  startButtons.forEach((button) => {
    button.addEventListener("click", () => startQuiz(button.dataset.gender));
  });

  answerOptions.forEach((option) => {
    option.addEventListener("click", () => {
      answerOptions.forEach((opt) => opt.classList.remove("selected"));
      option.classList.add("selected");
      option.querySelector("input").checked = true;
    });
  });

  prevButton.addEventListener("click", () => {
    if (currentQuestion > 0) {
      userAnswers[currentQuestion] = getSelectedAnswer();
      currentQuestion--;
      showQuestion(currentQuestion);
    }
  });

  nextButton.addEventListener("click", async () => {
    const questions = gender === "women" ? womenQuestions : menQuestions;
    userAnswers[currentQuestion] = getSelectedAnswer();

    if (currentQuestion < questions.length - 1) {
      currentQuestion++;
      showQuestion(currentQuestion);
    } else {
      // Quiz completed
      const quizData = prepareDataForChatGPT();
      console.log("Quiz completed! Data for ChatGPT:", quizData);
      switchScreen("screen2", "screen3");

      try {
        const routineData = await fetchRoutine(JSON.stringify(quizData));
        // Assuming fetchRoutine returns a JSON string, parse it
        console.log({ routineData });

        // Update the content in screen4 with the routine data
        const routineElement = document.getElementById("routine");

        if (routineElement) {
          routineElement.innerHTML = routineData;
        }

        // Switch to screen4 after updating the content
        switchScreen("screen3", "screen4");
      } catch (error) {
        console.error("Error fetching routine:", error);
        // Handle error (e.g., show an error message to the user)
        const errorElement = document.querySelector("#error-message");
        if (errorElement) {
          errorElement.textContent = "An error occurred. Please try again.";
          errorElement.style.display = "block";
        }
        // Optionally, switch back to screen2 or stay on screen3 with an error message
        // switchScreen("screen3", "screen2");
      }
    }
  });

  presentationBtn.addEventListener("click", () => {
    switchScreen("screen4", "screen1");
  });
});

async function fetchRoutine(data) {
  const messages = [
    {
      role: "system",
      content:
        "You are a fitness guru creating visually appealing HTML content for a website. Given data from a fitness quiz, create an engaging and structured HTML snippet for a personalized fitness routine. The routine should be no more than 200 words, describing quick and effective workouts to help achieve the user's dream figure. Format the content using semantic HTML5 elements, and include appropriate classes for styling. Do not include <html>, <head>, or <body> tags. Never act like you are an AI, always act like an expert fitness guru. Use the provided example to guide your style and tone.",
    },
    {
      role: "user",
      content: `Create a personalized routine for a ${
        data.gender
      } individual based on the following quiz responses: ${JSON.stringify(
        data.answers
      )}
      ###
      <section class="fitness-routine">
        <h2 class="routine-title">Your Personalized S.I.T. Routine</h2>
        <p class="routine-intro">Based on your answers, we've identified one simple method you can start <strong>TODAY</strong> to maximize results in minimal time.</p>
        <div class="routine-highlights">
          <ul>
            <li>No long hours in the gym</li>
            <li>No running miles on a treadmill</li>
            <li>No super intense cardio workout</li>
          </ul>
        </div>
        <p class="routine-description">Instead, this little-known <em>"S.I.T. routine"</em> can be done from the comfort of your home, using your body's own resistance, in just <strong>7 minutes a day</strong>.</p>
        <blockquote class="expert-quote">
          <p>World-renowned nutrition, fitness, and weight loss expert, Meredith Shirk, explains it all in the free presentation below.</p>
        </blockquote>
        <p class="routine-benefit">Discover the virtually foolproof way to finally melt off stubborn fat, regardless of your age or activity level, revealing a thinner, leaner, more toned body that you'll absolutely LOVE!</p>
      </section>
      ###
      `,
    },
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 1.1,
    });

    const report = response.choices[0].message.content;
    return report;
  } catch (error) {
    console.error(`Error : ${error}`);
    throw new Error("Unable to access AI. Please refresh and try again");
  }
}
